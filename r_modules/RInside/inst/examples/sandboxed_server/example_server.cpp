/*
 * Copyright (c) 2014 Christian Authmann
 */

#include "common/binarystream.h"
#include "common/constants.h"
#include "datatypes/foo.h"
#include "datatypes/bar.h"

#include <cstdlib>
#include <cstdio>
#include <string.h> // memset()
#include <map>
#include <atomic>
#include <iostream>
#include <fstream>
#include <stdexcept>

#include <chrono> // for sleeping
#include <thread>

#include <time.h>

#include <sys/types.h>
#include <sys/socket.h>
#include <sys/un.h>
#include <sys/wait.h>
#include <sys/stat.h>
#include <poll.h>
#include <signal.h>

/*
 * This is an example server. It sets up an R environment and a listening socket, then waits
 * for clients and fork()s.
 * The actual communication with clients is handled by server/rinsideserver.cpp.
 * This file only does initialization and process tracking.
 */

/*
 * Since the server fork()s a lot, we would like to prepend the pid to each logged line
 */
#define LOG(...) {fprintf(stderr, "%d: ", getpid());fprintf(stderr, __VA_ARGS__);fprintf(stderr, "\n");}

/*
 * If an R script gets stuck in an infinite loop, we need to stop it eventually. We thus define a global
 * timeout after which it gets killed.
 *
 * It would be desirable to allow the client to specify the timeout. Unfortunately, only the fork()ed
 * child process can communicate with the client, but the parent process needs to know about the timeout,
 * making this more complicated than one might expect.
 */
const int TIMEOUT_SECONDS = 600;

#include <RcppCommon.h>

#include "datatypes/foo_rcpp_wrapper_declarations.h"
#include "datatypes/bar_rcpp_wrapper_declarations.h"

#include <Rcpp.h>
#include <RInside.h>
#if !defined(RINSIDE_CALLBACKS)
#error "RInside was not compiled with RINSIDE_CALLBACKS"
#endif
#if !defined(RCPP_USING_CXX11)
#error "Rcpp didn't detect C++11 support (RCPP_USING_CXX11 is not defined)"
#endif

#include "datatypes/foo_rcpp_wrapper_definitions.h"
#include "datatypes/bar_rcpp_wrapper_definitions.h"


/*
 * The RInsideServer must be included AFTER RInside and all wrappers are included
 */
#include "server/rinsideserver.h"


int cmpTimespec(const struct timespec &t1, const struct timespec &t2) {
	if (t1.tv_sec < t2.tv_sec)
		return -1;
	if (t1.tv_sec > t2.tv_sec)
		return 1;
	if (t1.tv_nsec < t2.tv_nsec)
		return -1;
	if (t1.tv_nsec > t2.tv_nsec)
		return 1;
	return 0;
}


void signal_handler(int signum) {
	LOG("Caught signal %d, exiting", signum);
	exit(signum);
}


int main()
{
	// register our custom types with the server
	RInsideServer::registerDefaultTypes();
	RInsideServer::registerType<Foo>();
	RInsideServer::registerType<Bar>();


	// Install signal handlers
	int signals[] = {SIGHUP, SIGINT, 0};
	for (int i=0;signals[i];i++) {
		if (signal(signals[i], signal_handler) == SIG_ERR) {
			perror("Cannot install signal handler");
			exit(1);
		}
		else
			printf("Signal handler for %d installed\n", signals[i]);
	}
	signal(SIGPIPE, SIG_IGN);

	/*
	 * If R prints anything to the console, we must catch it.
	 * Instead of redirecting stdout (which we might want to use for diagnostics or logging), we
	 * use RInside's callbacks. They're marked experimental and aren't enabled by default, but in our
	 * tests, they worked just fine.
	 */
	RInsideCallbacks *Rcallbacks = new RInsideCallbacks();
	// Initialize R environment
	printf("...loading R\n");
	RInside R;
	R.set_callbacks( Rcallbacks );

	printf("...loading packages\n");
	try {
		/*
		 * Loading packages is slow. We want to load all common packages once on
		 * server startup, before the fork()
		 *
		 * For example, sandboxR might be useful to restrict the damage an R script can do.
		 * See https://github.com/rapporter/sandboxR
		 */
		//R.parseEval("library(\"sandboxR\")");
	}
	catch (const std::exception &e) {
		printf("error loading packages: %s\nR's output:\n%s", e.what(), Rcallbacks->getConsoleOutput().c_str());
		exit(5);
	}
	Rcallbacks->resetConsoleOutput();

	printf("R is ready\n");

	// get rid of leftover sockets
	unlink(ris_socket_address);

	// create a fresh socket
	int listen_fd = socket(AF_UNIX, SOCK_STREAM, 0);
	if (listen_fd < 0) {
		perror("socket() failed");
		exit(1);
	}

	// bind socket
	struct sockaddr_un server_addr;
	memset((void *) &server_addr, 0, sizeof(server_addr));
	server_addr.sun_family = AF_UNIX;
	strcpy(server_addr.sun_path, ris_socket_address);
	if (bind(listen_fd, (sockaddr *) &server_addr, sizeof(server_addr)) < 0) {
		 perror("bind() failed");
		 exit(1);
	}

	// adjust this for your own needs..
	chmod(ris_socket_address, 0777);


	/*
	 * We need to keep track of all the children to enforce timeouts. This map
	 * contains pids of all child processes and their end times.
	 */
	std::map<pid_t, timespec> running_clients;

	printf("Socket started, listening..\n");
	// Start listening and fork()
	listen(listen_fd, 5);
	while (true) {
		/*
		 * Try to reap all child processes that exited on their own. Not only
		 * will this keep our running_clients map small, it will also allow the
		 * OS to remove any "zombie" processes.
		 */
		int status;
		pid_t exited_pid;
		while ((exited_pid = waitpid(-1, &status, WNOHANG)) > 0) {
			LOG("Client %d no longer exists", (int) exited_pid);
			running_clients.erase(exited_pid);
		}
		/*
		 * Now check if any children exceeded their timeout. Kill them.
		 */
		struct timespec current_t;
		clock_gettime(CLOCK_MONOTONIC, &current_t);

		for (auto it = running_clients.begin(); it != running_clients.end(); ) {
			auto timeout_t = it->second;
			if (cmpTimespec(timeout_t, current_t) < 0) {
				auto timeouted_pid = it->first;
				LOG("Client %d gets killed due to timeout", (int) timeouted_pid);

				/*
				 * We kill the client using SIGHUP. Since we installed a signal handler, and signal handlers
				 * are kept during fork(), this should be enough to end it.
				 * That is, unless an R package removes the signal handler. In that case, we'd need to keep
				 * tracking the process and force a SIGKILL if it refuses to exit.
				 */
				if (kill(timeouted_pid, SIGHUP) < 0) {
					perror("kill() failed");
					++it;
				}
				else {
					// the postincrement of the iterator is important to avoid using an invalid iterator
					running_clients.erase(it++);
				}
			}
			else {
				++it;
			}

		}

		/*
		 * Wait for new connections.
		 *
		 * We may want to limit the amount of clients running at the same time.
		 */
		if (running_clients.size() > 10) {
			std::this_thread::sleep_for(std::chrono::milliseconds(5000));
			continue;
		}

		struct pollfd pollfds[1];
		pollfds[0].fd = listen_fd;
		pollfds[0].events = POLLIN;

		int poll_res = poll(pollfds, /* count = */ 1, /* timeout in ms = */ 5000);
		if (poll_res < 0) {
			perror("poll() failed");
			exit(1);
		}
		/*
		 * If no new connection is made within 5 seconds, we repeat the loop and check
		 * for finished or timeouted children again.
		 */
		if (poll_res == 0)
			continue;
		if ((pollfds[0].revents & POLLIN) == 0)
			continue;

		struct sockaddr_un client_addr;
		socklen_t client_addr_len = sizeof(client_addr);
		int client_fd = accept(listen_fd, (struct sockaddr *) &client_addr, &client_addr_len);
		if (client_fd < 0) {
			if (errno == EAGAIN || errno == EWOULDBLOCK)
				continue;
			perror("accept() failed");
			exit(1);
		}
		// fork
		pid_t pid = fork();
		if (pid < 0) {
			perror("fork() failed");
			exit(1);
		}

		if (pid == 0) {
			/*
			 * This is the child process.
			 *
			 * If the child process needs to drop any privileges the server may have had,
			 * this is an excellent time to do so.
			 * Whether it's a chroot, seccomp-bpf or a MAC framework like SELinux or AppArmor.
			 *
			 * Note that neither is an excuse to run the parent process unrestricted; creating
			 * a new restricted user for the server seems wise.
			 */
			close(listen_fd);
			LOG("Client starting");
			auto start_c = clock();
			struct timespec start_t;
			clock_gettime(CLOCK_MONOTONIC, &start_t);
			try {
				BinaryStream stream(client_fd, client_fd);
				RInsideServer ris(stream, R, *Rcallbacks);
				ris.run();
			}
			catch (const std::exception &e) {
				LOG("Exception: %s", e.what());
			}
			auto end_c = clock();
			struct timespec end_t;
			clock_gettime(CLOCK_MONOTONIC, &end_t);

			double c = (double) (end_c - start_c) / CLOCKS_PER_SEC;
			double t = (double) (end_t.tv_sec - start_t.tv_sec) + (double) (end_t.tv_nsec - start_t.tv_nsec) / 1000000000;

			LOG("Client finished, %.3fs real, %.3fs CPU", t, c);

			exit(0);
		}
		else {
			// This is the parent process
			close(client_fd);

			struct timespec timeout_t;
			clock_gettime(CLOCK_MONOTONIC, &timeout_t);
			timeout_t.tv_sec += TIMEOUT_SECONDS;
			running_clients[pid] = timeout_t;
		}
	}
}

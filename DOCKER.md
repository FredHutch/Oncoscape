# **Running and Developing Oncoscape with Docker** 
---

1. [What is Docker?](#1-what-is-docker)
2. [Installing Docker on Mac OS X](#2-installing-docker-on-mac-os-x)
3. [Installing Docker on Windows](#3-installing-docker-on-windows)
4. [Installing Docker on Linux](#4-installing-docker-on-linux)
5. [Running the Oncoscape Docker container](#5-running-the-oncoscape-docker-container)
6. [Developing Oncoscape inside a Docker container](#6-developing-oncoscape-inside-a-docker-container)

##1. What is Docker?

Docker is an open platform for building, shipping and running applications. It allows development teams to produce self-contained application containers that include not only the application but an environment, configuration and all required dependencies. If a Docker container based application runs on your development workstation, it will run exactly the same on any Docker powered systems without modification and without worrying about any application specific dependencies.  

Development teams using Docker can simply provide the container to operations teams to deploy, or to users of the application and be assured that the application will run.

Docker is not just for ease of deployment, it's also provides developers with a clean, isolated environment to consistently code, build and test their application on their development workstation.

##2. Installing Docker on Mac OS X

Running a Docker environment on Mac OS X requires Mac OS X 10.8 "Mountain Lion" or higher.

To get docker running on on a Mac follow the instructions below: 

- Go to the Docker Toolbox Mac OS page: https://www.docker.com/docker-toolbox
- Download the Mac OS X version of the installer
- Double-click on the downloaded installer (DockerToolbox-1.x.pkg)
- Following the install wizard to install the Docker-Toolbox
- See http://docs.docker.com/mac/step_one/ for more detailed install instructions

After the Docker Toolbox as been successfully installed, open a terminal and issue the following command: 

```bash
docker-machine ls
```
The output of the above command should look like this:

```
NAME      ACTIVE   DRIVER       STATE     URL   SWARM
default            virtualbox   Stopped         
```
This show you the name and state of the default Docker VM. You'll need to start up this VM before proceeding as follows:  

```bash
docker-machine start default
```

After the above command returns the Docker VM should be up and running. To configure your docker client to communicate with this new environment issue the following command in a terminal shell:

```bash
eval "$(docker-machine env default)"
```

Now lets make sure it's working by running a small "hello world" container with the following command:

```bash
docker run --rm hello-world
```

If everything works as expected you should, the output of the above command should like something like this:

```
$ docker run --rm hello-world
Unable to find image 'hello-world:latest' locally
latest: Pulling from library/hello-world
b901d36b6f2f: Pull complete 
0a6ba66e537a: Pull complete 
Digest: sha256:517f03be3f8169d84711c9ffb2b3235a4d27c1eb4ad147f6248c8040adb93113
Status: Downloaded newer image for hello-world:latest

Hello from Docker.
This message shows that your installation appears to be working correctly.
```

If your output looks like the above, then you're Mac is ready to use Docker.

##3. Installing Docker on Windows

Running a Docker environment on Microsoft Windows requires Windows 7, 8.x (Windows 10 is currently not supported).

To get docker running on on Windows, follow the instructions below: 

- Go to the Docker Toolbox page: https://www.docker.com/docker-toolbox
- Download the Microsoft Windows version of the installer
- Double-click on the downloaded installer (DockerToolbox-1.x.exe)
- Following the install wizard to install the Docker-Toolbox
- See http://docs.docker.com/windows/step_one/ for more detailed install instructions

After the Docker Toolbox as been successfully installed, double click on the "Docker Quickstart Terminal" shortcut that was created during the installation process. This will open a new terminal Window and start the default Docker VM (this may take a minute or two, especially the first time). When it's finished starting the terminal will look like the following:

```
                        ##         .
                  ## ## ##        ==
               ## ## ## ## ##    ===
           /"""""""""""""""""\___/ ===
      ~~~ {~~ ~~~~ ~~~ ~~~~ ~~~ ~ /  ===- ~~~
           \______ o           __/
             \    \         __/
              \____\_______/

docker is configured to use the default machine with IP 192.168.99.100
For help getting started, check out the docs at https://docs.docker.com
NOTE: When using interactive commands, prepend winpty. Examples: 'winpty docker run -it ...', 'winpty docker exec -it ...'.

MINGW64 ~
```

Now lets make sure it's working by running a small "hello world" container with the following command:

```bash
docker run --rm hello-world
```

If everything works as expected you should, the output of the above command should like something like this:

```
$ docker run --rm hello-world
Unable to find image 'hello-world:latest' locally
latest: Pulling from library/hello-world
b901d36b6f2f: Pull complete 
0a6ba66e537a: Pull complete 
Digest: sha256:517f03be3f8169d84711c9ffb2b3235a4d27c1eb4ad147f6248c8040adb93113
Status: Downloaded newer image for hello-world:latest

Hello from Docker.
This message shows that your installation appears to be working correctly.
```

If you're output looks like the above, then your Windows system is ready to use Docker

I you get an error like "An error occurred trying to connect..." you probably need update the docker environment variables in the Docker terminal with the command below and try again:

```bash
eval "$(docker-machine env --shell=bash default)"
```

##4. Installing Docker on Linux

Docker runs natively on Linux so you won't have to install an enabling technology like Docker Machine or Boot2Docker as is required on Windows and Mac OS platforms. 

Docker requires a 64-bit version regardless and your kernel must be 3.10 at minimum. Linux distributions such as Ubunut 14.04+ and CentOS 7 are ready to run docker. To pull images from the the Docker Hub you'll need docker version 1.6 or higher.

Docker can be installed using your distributions package manager. For example the following will install Docker 1.6 on Ubuntu 14.04: 

```bash
sudo apt-get -y update
sudo apt-get -y install docker.io
```

As an alternative to using our distributions packages (above method), you can install the very latest version of Docker by getting Docker packages directly from the Docker project. For example, the commands below will get the very latest version of Docker running on an Ubuntu 14.04 system:    

```bash
sudo apt-key adv --keyserver hkp://pgp.mit.edu:80 --recv-keys 58118E89F3A912897C070ADBF76221572C52609D
sudo echo "deb https://apt.dockerproject.org/repo ubuntu-trusty main"  > /etc/apt/sources.list.d/docker.list
sudo apt-get -y update
sudo apt-get -y purge lxc-docker*
sudo apt-cache -y policy docker-engine
sudo apt-get -y install docker-engine
```

After you've installed Docker on your Linux system following one of the above methods, make sure it's working by running a small "hello world" container with the following command:

```bash
sudo docker run --rm hello-world
```

If everything works as expected the output of the above command should look something like this:


```
$ sudo docker run hello-world
Unable to find image 'hello-world' locally
Pulling repository hello-world
975b84d108f1: Download complete 
3f12c794407e: Download complete 

Hello from Docker.
This message shows that your installation appears to be working correctly.
```

***NOTE:*** to avoid having to use "sudo" for every docker command, you and add your account to the local "docker" group (create it if it doesn't already exist).

##5. Running the Oncoscape Docker container

Before you can run Oncoscape, we first need to pull it down to the system we are going to run it on. This is accomplished with the following command:

```
docker pull fredhutch/oncoscape
```
The above command will take a while as it downloads all the layers of the Oncoscape image. When it's done, you can run the "master" branch (production) version of Oncoscape with the following command:

```
docker run -d --name oncoscapemaster -p 7777:7777 fredhutch/oncoscape:latest  
```

The above command will create a new conatiner running the master/prod (denoted by the ':latest' tag). It will name the container "oncoscapemaster" and will bind tcp port 7777 inside the container to tcp port 7777 on the Docker system.

If you'd rather run the development version (develop branch) of Oncoscape 

```
docker run -d --name oncoscapedev -p 7777:7777 fredhutch/oncoscape:develop  
```

***NOTE:*** you can run multiple oncoscape containers on the same system all listening on the same port inside the container (7777 in the examples above) but only one container can bind to any given port on the Docker host at a time. If you want multiple Oncoscape containers running at the same time you'll need to bind each to a unique port. For example '-p 7777:7777' for the production container and '-p 7778:7777' for the development container.

To access the application just open a web browser (Chrome is currently the only supported browser) and navigate to the application depending on how you are running Docker: 

- **Local Linux workstation**: http://localhost:7777
- **Remote Linux server**: http://removeservername:7777
- **Local Mac OS X or Windows system**: you'll first need to determine the IP address of the Docker Machine with the command "*docker-machine ip default*", then point your browser to this IP address, appending the Oncoscape port, for example http://192.168.99.100:7777 (replacing 192.168.99.100 with the IP of your Docker Machine VM).

You can see which conatiners are running on your system with the "docker ps" command. For example, the output below shows that a development and production (master) version of Oncoscape is currently running on this system:

```
$ docker ps
CONTAINER ID    IMAGE                        STATUS       PORTS                    NAMES
a3e1594b90de    fredhutch/oncoscape:latest   Up 3 hours   0.0.0.0:7777->7777/tcp   oncoscapemaster     
6cfad3997f0d    fredhutch/oncoscape:develop  Up 3 hours   0.0.0.0:7778->7777/tcp   oncoscapedev        
```

You can stop/start containers that you've created with the 'docker stop/start *containername*' commands as follows:

```
$ docker stop oncoscapemaster
oncoscapemaster
$ docker start oncoscapemaster
oncoscapemaster
```
If you want to delete a conatiner, first stop it then delete with the 'docker rm *containername*' command as follows:

```
$ docker stop oncoscapedev
oncoscapedev
$ docker rm oncoscapedev
oncoscapedev
```



##6. Developing Oncoscape inside a Docker container

*Coming Soon*


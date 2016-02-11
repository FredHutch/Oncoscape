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

To get docker running on a Mac follow the instructions below: 

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

Now let's make sure it's working by running a small "hello world" container with the following command:

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

Running a Docker environment on Microsoft Windows requires Windows 7, 8.x, or 10

To get docker running on on Windows, follow the instructions below: 

- Go to the Docker Toolbox page: https://www.docker.com/docker-toolbox
- Download the Microsoft Windows version of the installer
- Double-click on the downloaded installer (DockerToolbox-1.x.exe)
- Following the install wizard to install the Docker-Toolbox
- See http://docs.docker.com/windows/step_one/ for more detailed install instructions

After the Docker Toolbox has been successfully installed, double click on the "Docker Quickstart Terminal" shortcut that was created during the installation process. This will open a new terminal Window and start the default Docker VM (this may take a minute or two, especially the first time). When it's finished starting the terminal will look like the following:

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

Docker requires a 64-bit version regardless and your kernel must be 3.10 at minimum. Linux distributions such as Ubuntu 14.04+ and CentOS 7 are ready to run docker. To pull images from the the Docker Hub you'll need docker version 1.6 or higher.

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

This section covers running Oncoscape in a container for either test/demo purposes or deploying on a production server. If you just want to get Oncoscape up and running quickly to check it out, then this section is for you. If you want to build and develop Oncoscape in a container, skip this section and move on to [Developing Oncoscape inside a Docker container](#6-developing-oncoscape-inside-a-docker-container).

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

You can see which containers are running on your system with the "docker ps" command. For example, the output below shows that a development and production (master) version of Oncoscape is currently running on this system:

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

In the previous section we simply ran Oncoscape in a container, but Docker is not just for running and deploying applications, it’s great for development too. Using Docker for development provides consistent, clean development environment. Each build can be in a fresh environment without any dependencies on your development workstation or clashes/contamination with your workstation. All developers can use the same OS, same system libraries, same language runtime, no matter what host OS they are using (even Windows). The development environment is the exact same as the production environment. You only need Docker to develop; you don’t need to install a bunch of language environments, libraries and tools on your machine. 

A Docker conatiner recipe for the Oncoscape development environment is located at https://github.com/FredHutch/Oncoscape-dev-environment

To use the Oncoscape development container use 'git' to clone the Oncoscape development container repository to your Docker enabled development system, build a container image and then run it. Here are the commands required to create a container image tagged "oncodev" (you can name it something else if you would like): 

```bash
git clone https://github.com/FredHutch/Oncoscape-dev-environment.git
cd Oncoscape-dev-environment
docker build -t oncodev .
```
The build process will take several minutes to complete. When the build is finished, there will be a new container image registered with your Docker engine named "oncodev" (or whatever you named it). Check to see that the new image was registered with the following command:

```bash
docker images
```
The above command will list the images registered with your docker engine and will look similar to the following:

```
REPOSITORY      TAG         IMAGE ID        CREATED         VIRTUAL SIZE
oncodev         latest      31ee6c745277    2 minutes ago    751.8 MB
```

Now that we have an image registered, you are ready to start making development environment containers. To use the development environment, create and run a container from the image you built and registered. Here is an example (assuming you named your image 'oncodev'):

```bash
docker run -ti -p 7777:7777 --name myoncodev01 --hostname myoncodev01 oncodev
```
Paramater Description:
  - '--name myoncodev01' flag tags this container (choose whatever name you like). 
  - '--hostname myoncodev01' sets the hostname inside the container to match the container instance name. The bash prompt inside the container will include the provided hostname to make it clear what environment you are currently in. 
  - '-p 7777:7777' flag tells docker that you want to bind TCP port 7777 inside your container to TCP port 7777 on your Docker-Machine VM (or directly to the host on Linux). You can bind as many ports as you need by using multiple '-p' arguments. The port you bind to outside the container doesn't have to match the port inside the container. For example '-p 80:7777' will map TCP port 80 outside the container to TCP port 7777 inside the container.

After you execute the above command you'll be dropped to a bash shell inside this new container. You are now root in an isolated Linux environment that has everything that you need to build and run Oncoscape. The container is empty so you'll need to clone the Oncoscape repo (git is included in the container) and install/build/configure/run as you like. You can create new branches, edit code (vim, emacs and nano are provided), commit and push to github right from inside the container. 

***NOTE:*** Windows users only. While the "Docker Quick Start Terminal" is fine for managing, starting, and stopping containers, you'll want to use either the standard command prompt (cmd.exe) or Powershell consoles for interactive work such editing files inside the container. Note that when using 'vi' in a container via cmd.exe or Powershell consoles, the arrow keys do not work and you'll need to use the traditional 'hjkl' keys to move the cursor: 'h'=left, 'j'=down, 'k'=up, 'l'=right.

Setup the environment variables required by docker for the shell of your choice as shown below:

***Classic command prompt (cmd.exe)***
```
FOR /f "tokens=*" %i IN ('docker-machine.exe env --shell=cmd default') DO %i
```
***Powershell***
```
docker-machine.exe env --shell=powershell default | Invoke-Expression
```

After you build and run Oncoscape in a container you'll likely want to point your browser at it. If you are running docker on Linux, you simply point your browser at either http://localhost:7777 (replacing 7777 with the TCP port bound outside the container) or http://servername:7777 if it's running on a remote server. If you are running Docker on Mac OS X or Windows you first have to determine the IP address of the Docker Machine VM. To do so you'll need to run the following command:

```bash
docker-machine ip default
```

The output of the above command will be a private IP address that you can only reach from your development workstation. After you have this IP address simply point you browser at it with the desired port; "http://192.168.99.100:7777" for example.

#### Stopping and starting your containers

To stop your development container, simply exit the bash shell with the "exit" command. This will stop the container and drop you back on your workstation’s command line. You can see all of your containers running and stopped with the following command:

```bash
docker ps -a
```
The output of the above command will look similar to the following:

```
CONTAINER ID   IMAGE      COMMAND   CREATED             STATUS                 NAMES
3bb2bc400dd3   oncodev    "bash"    19 minutes ago      Exited 7 seconds ago   myoncodev01               
```

If you want to start your container again and enter it, simply run the following commands replacing "myoncodev01" with the name of your container:

```bash
docker start myoncodev01
docker attach myoncodev01
```
This will drop you back into an instance of bash running inside your container. 

You're not limited to a single container, you can have as many different Oncoscape development environments on your system as you need.

#### Accessing data outside of your container

In the examples above we cloned the Oncocape repository inside of the container. If you'd rather clone it to your workstation directly and access it from inside your container you can use the Docker 'volumes' feature. For example let's say you have cloned the Oncoscape repo to /Users/myuser/Oncoscape and want to fire up a container and access this external data from inside your container. To accomplish this you'll need to use the '-v' flag when creating a new container and tell it what folder on your workstation you want to be mounted inside the container. Here is an example:

```bash
docker run -ti -p 7777:7777 -v /Users/myuser/Oncoscape:/opt/Oncoscape --name myoncodev02 --hostname myoncodev02 oncodev
```

After running the above command, you should see that the '/User/myuser/Oncoscape' folder on your development workstation is now mounted read/write to '/opt/Oncoscape' inside this new container. You can change to this directory and use git just like you do on your workstation. It's worth noting that any modifications to this directory or files it contains inside the container, is directly modifying the files outside of your container. This approach can save you a lot of time and disk space by not having to clone the repo inside each container, but if you need true isolation between each conatiner, this might not be the right approach.

***NOTE:*** Windows users can't specify the local folder they want mounted in the traditional *'C:/xyz'* format. You'll need to use the *'/c/xzy'* format. For example *"-v /c/Users/myuser/Oncoscape:/opt/Oncoscape"* will mount 'C:\Users\myuser\Oncoscape' on your workstation to *'/opt/Oncoscape'* inside the container.

#### Cleaning up unneeded containers and images

To delete a container you don't need any longer, it must first be stopped if it's currently running then use the following command replacing "myoncodev03" with the name of the container you wish to delete:

```
docker rm myoncodev03
```

To delete the oncodev image that you built, first there must be no containers running or stopped that are based off of it. When there are no containers created from the oncodev image remaining you can delete this image with the following command replacing "oncodev" with name of the image you created:

```
docker rmi oncodev
```

You can see which containers are on you workstation with the "docker ps -a" command and which images are on your workstation with the "docker images" command.

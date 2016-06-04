The following instructions describe how to install and run Oncoscape with the necessary data, analysis, and R dependency packages.  

1. [System Requirements](#1-system-requirements)
2. [Installing Oncoscape](#2-installing-oncoscape)
3. [Running Oncoscape](#3-running-oncoscape)
4. [Running and Developing Oncoscape with Docker](#4-running-and-developing-oncoscape-with-docker)

## 1. System Requirements

- [Linux Requirements](#linux-system-requirements-and-dependencies)
- [Mac OS X Requirements](#mac-os-x-system-requirements-and-dependencies)
- [Windows Requirements](#windows-system-requirements-and-dependencies)

### Linux System Requirements and Dependencies

- Recent version of Linux (CentOS 6+, Ubuntu 14.04+, Debian 7+ or similar) 
- 2GB+ free RAM
- 4GB free disk space

Before you can successfully install Oncoscape on a Linux system you will need to satisfy the following dependencies:

- R (version 3.2.2+)
- gcc
- g++
- make
- nodejs 5.x
- node-gyp
- git

On Ubuntu 14.04 these dependencies can be installed as follows:

```bash
# ADD the CRAN Repo to the apt sources list
sudo echo "deb http://cran.fhcrc.org/bin/linux/ubuntu trusty/" > /etc/apt/sources.list.d/cran.fhcrc.org.list

# Add the package verification key
sudo apt-key adv --keyserver keyserver.ubuntu.com --recv-keys 51716619E084DAB9

# Update the system and install packages
sudo apt-get -y update && apt-get -y install \
	r-base=3.2.2* \
	r-recommended=3.2.2-1trusty0* \
	make \
	gcc \
	g++ \
	git
	
# Install latest version of Node 5.x
RUN curl -sL https://deb.nodesource.com/setup_5.x | bash -
RUN apt-get -y install nodejs

# Install node-gyp
npm install -g node-gyp
```

After installing all the dependencies above on your Linux system, you are ready to build the Oncoscape application.

### Mac OS X System Requirements and Dependencies

- Mac OS 10.8 (Mountain Lion) or greater
- 2GB+ free RAM
- 4GB free disk space

Before you can successfully install Oncoscape on a Mac OS X system, you will need to satisfy the following dependencies:

- R (version 3.2.2+)
- Xcode command-line tools (provides make, git, etc...)
- nodejs 5.x 
- node-gyp

To install the R head over the the CRAN site (https://cran.r-project.org/mirrors.html), pick a mirror site closest to you then download the latest version of R (currently 3.2.3) for Mac OS X and install it. If you are already running the Homebrew package manager, you can alternatively install R as follows:

```bash
brew tap homebrew/science
brew install r
```

If you don't already have the XCode command-line tools installed, just open up a terminal window and execute the following command:

```bash
make
```

If the Xcode command-line tools are not already installed a dialog will pop up asking if you'd like to install them. Click on the "install" button in this dialog to install the required tools. NOTE: you can install the entire Xcode IDE if you like by clicking "get Xcode" button rather than "install" but only the command-line tools are required to run and develop Oncoscape.

To install the latest version of Node.js, visit https://nodejs.org/en/download/ and download the latest Mac OSX node package. After the download is complete, double click on the node-*.pkg and install node on your system. If you are already running the Homebrew package manager, you can alternatively install Node.js as follows:

```bash
brew install node
```

Finally you'll need to install node-gyp. Node-gyp is a tool for compiling native add-on modules for Node.js and is required for the "rstats" add-on that is used interface node with R. To install node-gyp, run the following command:

```bash
sudo npm install -g node-gyp
```

After installing the above dependencies on your Mac OS X system, you are ready to build the Oncoscape application.


### Windows System Requirements and Dependencies 

***Note:***  Oncoscape will not currently run natively on Windows due to some Unix only components that are being used. To run Oncoscape on Windows, you must either use a hypervisor such as VirtualBox, Hyper-V or VMware and run Oncoscape in a Linux VM or you can run it in a Docker container using the Docker Toolbox for Windows.

## 2. Installing Oncoscape

### Mac OS X and Linux Install Instructions

The first thing that you'll need to do is download the Oncoscape application source from GitHub and place it in the location you wish it to live. Open a terminal window and run the commands below, replacing "\<path\>" with the location you wish to install Oncoscape:

```bash
cd /<path>
git clone https://github.com/FredHutch/Oncoscape.git
cd Oncoscape
git checkout develop
```

After the git clone is complete, switch to the r_modules sub directory where Oncoscape was downloaded and build them with the "sudo make install" command as shown below:

```bash
cd /<path>/Oncoscape/r_modules
sudo make install
```

The module build process will take just a few minutes to complete on a Mac OS X system but will take several minutes on a Linux system as the R modules will be compiled from source.

Next you'll need to install the required node modules by running the "npm install" command in the 'server' directory as shown below:

```
cd /<path>/Oncoscape/server
npm install
```

After the node modules are installed, you'll need to install the rstats library with node-gyp as follows:

```
cd /<path>/Oncoscape/server/rstats
npm install 
```

You are now ready to run Oncoscape.


## 3. Running Oncoscape 

### Running Oncoscape on Linux and Mac OS X

After you've installed all required dependencies and installed Oncoscape as described above, you are now ready to run Oncoscape. You can run Oncoscape by executing the following commands:

```
cd /<path>/Oncoscape/server
sudo node start.js
```

The output from the above command shoud look like the following:

```
SockJS v0.3.16 bound to "/oncoscape"
Http Server Started On: 3000
Socket Server Started On: 3001
Proxy Server Started On: 80
```

After the Oncoscape application has started, open a web browser and navigate to http://localhost to access Oncoscape. If you are running Oncoscape on a remote server, you'll need open a web browser and navigate to the Oncoscape application replacing "yourservername.com" with the name of the server where Oncoscape is running.

> http://yourservername.com


## 3. Running Oncoscape Development Environment
To manage javascript dependencies and streamline the development workflow, Oncoscape utilizes Gulp, Bower, Sass and Bootstrap.  For more information on these technologies please visit our wiki at XXXXXX.

Before you can successfully run Oncoscapes client build server, you will need to satisfy the following dependencies:

- Gulp 3.9.1
- Bower 1.7.7

```bash
cd /<path>/Oncoscape/client
npm install -g gulp
npm install -g bower 
```

Next you will need to install the Node Modules required by Gulp and Javscript Libraries required by Oncoscape.

```bash
npm install
bower install
bower update
```

Now that you've installed all the required dependencies you are ready to run the development server development server.

```bash
gulp serve
```

If you are having difficulty interacting with Oncoscape, please make sure that the Oncoscape server is still running.  If not you can restart it by executing the following commands in a seperate termininal window.

```
cd /<path>/Oncoscape/server
sudo node start.js
```


## 4. Running and Developing Oncoscape with Docker

Oncoscape is currently available as a Docker container on Docker Hub at:
	
>https://hub.docker.com/r/fredhutch/oncoscape/

Both the latest stable release (tagged "latest") and development version (tagged "develop") are available in container format at the above link.

Detailed documentation covering the use of Docker with Oncoscape can be found in the [DOCKER.md](https://github.com/FredHutch/Oncoscape/blob/master/DOCKER.md) file in this repository.

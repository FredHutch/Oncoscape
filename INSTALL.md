The following instructions describe how to install and run Oncoscape with the necessary data, analysis, and R dependency packages.  

1. [System Requirements](#1-system-requirements)
2. [Installing Oncoscape](#2-installing-oncoscape)
3. [Running Oncoscape](#3-running-oncoscape)
4. [Running and Developing Oncoscape with Docker](#4-running-and-developing-oncoscape-with-docker)


## 1. System Requirements

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
RUN npm install -g node-gyp
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

To install the R head over the the CRAN site (https://cran.r-project.org/mirrors.html), pick a mirror site closest to you then download the latest version of R (currently 3.2.3) for Mac OS X and install it. If you are already running the Brew package manager, you can alternatively install R as follows:

```bash
brew install r
```

If you don't already have the XCode command-line tools installed, just open up a terminal window and execute the following command:

```bash
make
```

If the Xcode command-line tools are not already installed a dialog will pop up asking if you'd like to install them. Click on the "install" button in this dialog to install the required tools. NOTE: you can install the entire Xcode IDE if you like by clicking "get Xcode" button rather than "install" but only the command-line tools are required to run and develop Oncoscape.

After installing the above dependencies on your Mac OS X system, you are ready to build the Oncoscape application.


### Windows System Requirements and Dependencies 

- Windows 7/2008 or greater
- 2GB+ free RAM
- 4GB free disk space

Before you can successfully install Oncoscape on a Mac OS X system you will need to satisfy the following dependencies:

- R (version 3.2.2+)
- Cygwin (for make, bash and git)
- nodejs
- node-gyp

To install the R head over to the CRAN site (https://cran.r-project.org/mirrors.html), pick a mirror site closest to you then download the latest version of R (currently 3.2.3) for Windows and install it. After it's installed make sure that you add the R binaries to your system path (control panel -> system -> advanced system settings -> environment variables -> system variables). If you accepted the defaults, the R binaries will be located at *"C:\Program Files\R\bin"*.

Next you'll need to install Cygwin. Go to http://cygwin.com/install.html and download the Cygwin installer "setup-x86_64.exe". Next open a command-line window and change the directory to where the Cygwin installer was downloaded and enter the following command:

```
setup-x86_64.exe -q -P make,bash,git
```

The above command should bring up the Cygwin installer dialog. Select a mirror closest to you and click "next" until the installation is complete. There should be no need to adjust the package selection as the command-line options provided to the installer will select everything we need. After the installation is complete, adjust your Windows system path to include the Cygwin binaries (*"C:\cygwin64\bin" by default*).

***Note:*** after adjusting the system path and defining new system environment variables on Windows, you'll need to exit the console (cmd.exe) and open it again before the updated path and new environment variables will take effect.

After installing the above dependencies on your Windows system, you are ready to install the Oncoscape application.

## 2. Installing Oncoscape

### Mac OS X and Linux Install Instructions

The first thing that you'll need to do is download the Oncoscape application source from GitHub and place it in the location you wish it to live. Open a terminal window and run the commands below, replacing "\<path\>" with the location you wish to install Oncoscape:

```bash
cd /<path>
git clone https://github.com/FredHutch/Oncoscape.git
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

After the node modules are installed, you'll need to install the rstats library with node-gyp as folllows:

```
cd /<path>/Oncoscape/rstats
node-gyp configure build 
```

You are now ready to run Oncoscape.

### Windows Install Instructions

The first thing that you'll need to do is download the Oncoscape application from GitHub and place it in the location you wish it to live. Open a console session (cmd.exe not PowerShell) and run the commands below, replacing \<path\> with the location you wish to install Oncoscape:

```
cd C:\<path>
git clone https://github.com/FredHutch/Oncoscape.git
```

After the git clone is complete, switch to the directory where Oncoscape was downloaded and build it with the "make install" command as shown below:

```
cd C:\<path>\Oncoscape
make install
```

## 3. Running Oncoscape

### Running Oncoscape on Linux and Mac OS X

After you've installed all required dependencies and installed Oncoscape as described above, you are now ready to run Oncoscape. You can run Oncoscape by executing the following commands:

```
cd /<path>/Oncoscape
node start.js
```

After the Oncoscape application has started, open a web browser and navigate to http://localhost to access Oncoscape. If you are running Oncoscape on a remote server, you'll need open a web browser and navigate to the Oncoscape application replacing "yourservername.com" with the name of the server where Oncoscape is running.

> http://yourservername.com


### Running Oncoscape on Windows

After you've installed all required dependencies and installed Oncoscape as described above, you are now ready to run Oncoscape. You can run Oncoscape by executing the following commands:

```
cd /<path>/Oncoscape
node start.js
```

## 4. Running and Developing Oncoscape with Docker

Oncoscape is currently available as a Docker container on Docker Hub at:
	
>https://hub.docker.com/r/fredhutch/oncoscape/

Both the latest stable release (tagged "latest") and development version (tagged "develop") are available in container format at the above link.

Detailed documentation covering the use of Docker with Oncoscape can be found in the [DOCKER.md](https://github.com/FredHutch/Oncoscape/blob/master/DOCKER.md) file in this repository.

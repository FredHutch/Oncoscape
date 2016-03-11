The following instructions describe how to install and run Oncoscape with the necessary data, analysis, and R dependency packages.  

1. [System Requirements](#1-system-requirements)
2. [Installing Oncoscape](#2-installing-oncoscape)
3. [Oncoscape Configuration](#3-oncoscape-configuration)
4. [Running Oncoscape](#4-running-oncoscape)
5. [Running and Developing Oncoscape with Docker](#5-running-and-developing-oncoscape-with-docker)


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
- node
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
- Xcode command-line tools (provides make,etc...)

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
- Cygwin (for make and git)

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

After the git clone is complete, switch to the r_modules sub directory where Oncoscape was downloaded and build it with the "sudo make install" command as shown below:

```bash
cd /<path>/Oncoscape/r_modules
sudo make install
```

The build process will take just a few minutes to complete on a Mac OS X system but will take several minutes on a Linux system as the R modules will be compiled from source.

The above install method will install R packages in the systems default system-wide path. If you'd rather build and install the R packages in a alternate location (such as your home folder), first set the "R_LIBS" environment variable to the desired path and execute "make installLocal" as shown in the example below:

```bash
export R_LIBS=/<path>/rlibs
make installLocal
```

If you chose to build and install the R libraries in an alternate location (as above example), you'll need to make sure that the R_LIBS environment variable is set before each time Oncoscape is run. One way to accomplish this is to add the following line to your ~/.bash_profile replacing '/home/myhome/rlibs' with the path used for the alternate R library path: 

```bash
export R_LIBS=/home/myhome/rlibs
```

After the application has been successfully built and installed, you should test it to ensure that everything is working as expected. This can be accomplished by running the provided 'test' make target. Before running the test suite (or running the Oncoscape app itself), you'll need to create a directory to store user data and export it as follows (replace "\<path\>" with the actual path): 

```bash
sudo mkdir /<path>/userdata
export ONCOSCAPE_USER_DATA_STORE=file:///<path>/userdata
```
With the user data store directory in place and environment variable exported, the test suite can be executed with the following command:

```bash
sudo make test
```

If all tests passed (you should see "OK:  all python websocket json tests passed") you are ready to proceed to running Oncoscape.


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

The above install method will install R packages in the default system-wide path. If you'd rather build and install the R packages in a alternate location (such as your home folder), first create a direcotry to hold the packages, then set the "R_LIBS" Windows System environment variable to point at the target folder, then execute the following command:

```
cd C:\<path>\Oncoscape
make installLocal
```

After the Oncoscape has been successfully built and installed, you should test it to ensure that everything is working as expected. This can be accomplished by running the provided 'test' make target. Before running the test suite (or running the Oncoscape app itself), you'll need to create a directory to store user data and create a new Windows System environment variable named "ONCOSCAPE_USER_DATA_STORE" with a value of file://c:\\\\path\\\\userdata" (replacing the "path" and "userdata" with the correct path and target directory on your system.

With the userdata directory in place and the environment variable set, the test suite can be executed with the following command:

```
make test
```

If all tests passed (you should see "OK:  all python websocket json tests passed") you are ready to proceed to running Oncoscape.

***NOTE:*** There is currently an issue (#99) that prevents the test suite from running successfully on Windows. If your test run fails and issue #99 is still open, you won't be able to complete the tests, but Oncoscape should still run.  

## 3. Oncoscape Configuration

The default Oncoscape configuration file is located at 'Oncoscape/inst/scripts/apps/oncoscape/runOncoscapeApp-7777.R' 

Edit this file to meet your specific needs, such as the TCP port you want the server to listen on and what datasets you want to load on startup. By default when you run Oncoscape it will automatically open a web browser and navigate to the Oncoscape application. If you are running Oncoscape on a remote server rather than your local workstation, this won't work and you'll need to manually navigate to the server address and configured oncoscape port.

To change the port while Onoscape listens, modify the "port" variable. To modify the datasets that are loaded on startup, modify the "current.datasets" variable. Below in an example configuration:

```R
library(OncoDev14)
sessionInfo()
scriptDir <- "apps/oncoscape"
stopifnot(nchar(Sys.getenv("ONCOSCAPE_USER_DATA_STORE")) > 0)
userID <- "test@nowhere.org"
current.datasets <- c("TCGAgbm;TCGAbrain")
port <- 7777
onco <- OncoDev14(port=port, scriptDir=scriptDir, userID=userID, datasetNames=current.datasets)
if(Sys.info()[["nodename"]] != "yourservername") 
   browseURL(sprintf("http://localhost:%d", port))
run(onco)
```

## 4. Running Oncoscape

### Running a Global Installation on Linux and Mac OS X

If you performed a system-wide install of the Oncoscape R libraries (make install), the following command will kill any current running Oncoscape instances and launch Oncoscape as defined in the configuration file:

```bash
make oncoApp7777
```

### Running a Local Installation on Linux and Mac OS X

If you installed the Oncoscape R packages in a defined location (make installLocal), the following command will kill any current running Oncoscape instances and launch Oncoscape as defined in the configuration file:

```bash
make oncoAppLocal7777
```

After the Oncoscape application has started, a web browser should open and automatically navigate to the Oncoscape application. If you are running Oncoscape on a remote server, you'll need open a web browser and navigate to the Oncoscape application. Example URL if using the default port:

> http://yourservername.com:7777

After launching Oncoscape, it takes about 15 seconds before it starts listening for connections, so be patient.


### Running a Global Installation on Windows

If you performed a system-wide install of the Oncoscape R libraries (make install) the following command will launch Oncoscape as defined in the configuration file:

```
make oncoWin
```

### Running a Local Installation on Windows

If you installed the Oncoscape R packages in a defined location (make installLocal) the following command will launch Oncoscape as defined in the configuration file:

```
make oncoWinLocal
```

After the Oncoscape application has started, a web browser should open and automatically navigate to the Oncoscape application. If you are running Oncoscape on a remote server, you'll need open a web browser and navigate to the Oncoscape application. Example URL if using the default port:

> http://yourservername.com:7777

After launching Oncoscape, it takes about 15 seconds before it starts listening for connections, so be patient.

***Note:*** When Oncoscape is run under Windows (via either 'make oncoWin' or make 'oncoWinLocal'), Oncoscape will run in the foreground of the command-line console. If you wish to stop Oncoscape, hit "CTRL-C" to kill it.

## 5. Running and Developing Oncoscape with Docker

Oncoscape is currently available as a Docker container on Docker Hub at:
	
>https://hub.docker.com/r/fredhutch/oncoscape/

Both the latest stable release (tagged "latest") and development version (tagged "develop") are available in container format at the above link.

Detailed documentation covering the use of Docker with Oncoscape can be found in the [DOCKER.md](https://github.com/FredHutch/Oncoscape/blob/master/DOCKER.md) file in this repository.

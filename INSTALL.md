The following instructions describe how to install and run Oncoscape with the necessary data, analysis, and R dependency packages.  

1. System Requirements
2. Building and Installing Oncoscape
3. Configuration
4. Running Oncoscape


# 1. System Requirements

### Linux System Requirements and Dependencies

- Recent version of Linux (CentOS 6+, Ubuntu 14.04+, Debian 7+ or similar) 
- 2GB+ free RAM
- 4GB free disk space

Before you can successfully install Oncoscape on a Linux system you will need to satisfy the following dependencies:

- R (version 3.2.1+)
- gcc
- g++
- make
- m4
- Python 2.7
- Python websocket-client module
- libxml2 & libxml2-dev
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
	vim \
	make \
	git \
	m4 \
	gcc \
	g++ \
	libxml2 \
	libxml2-dev \
	python-pip
        
# Install the websocket-client with pip
sudo pip install websocket-client 
```

After installing all the dependencies above your Linux system you are ready to build and test the Oncoscape application.

### Mac OS X System Requirements and Dependencies

- Mac OS 10.8 (Mountain Lion) or greater
- 2GB+ free RAM
- 4GB free disk space

Before you can successfully install Oncoscape on a Mac OS X system you will need to satisfy the following dependencies:

- R (version 3.2.1+)
- Xcode command-line tools (provides git/gcc/g++/make,etc...)
- Python websocket-client module

To install the R head over the the CRAN site (https://cran.r-project.org/mirrors.html), pick a mirror site closest to you then download the latest version or R (currently 3.2.2) and install it. If you are already running the Brew package manager, you can alternatively install R as follows:

```bash
brew install r
```

If you don't already have the XCode command-line tools installed, just open up a terminal window and execute the following command:

```bash
gcc
```

If the Xcode command-line tools are not already installed a dialog will pop up asking if you'd like to install them. Click on the "install" button in this dialog to install the required tools. NOTE: you can install the entire Xcode IDE if you like by clicking "get Xcode" button rather than "install" but only the command-line tools are required to run and develop Oncoscape.

If you are using the default version of Python 2.7 that ships with Mac OS X, it's missing the pip installer required to install the websocket-client module. The following will install both pip and the required python module: 

```bash
sudo easy_install pip
sudo pip install websocket-client
```

After installing the above dependencies on your Mac OS X system, you are ready to build and test the Oncoscape application.


### Windows System Requirements and Dependencies 

***NOTE***: Oncoscape uses a Unix tool-chain to build, test, install and run. Many of these tools are not native to the Windows platform so Oncoscape will currently not work out of the box on Windows. We are planning to offer instructions for the Windows platform soon.

# 2. Building and Installing Oncoscape

### Mac OS X and Linux Build and Install Instructions

The first thing that you'll need to do is download the Oncoscape application from GitHub and place it in the location you wish it to live. run the commands below, replacing <path> with the location you wish to install Oncoscape:

```bash
cd /<path>
git clone https://github.com/FredHutch/Oncoscape.git
```


After the git clone is complete, switch to the directory where Oncoscape was downloaded and build it with the "sudo make install" command as shown below:

```bash
cd /<path>/Oncoscape
sudo make install
```

The the build process will take several minutes to complete. It can up to 20 minutes if this is the first time installing Oncoscape on your system.

The above install method will install R packages in the systems default system-wide path. If you'd rather build and install the R packages in a alternate location (such as your home folder), first set the "R_LIBS" environment variable to the desired path and execute "make installLocal" as shown in the example below:

```bash
export R_LIBS=/<path>/rlibs
make installLocal
```

If you chose to build and install the R libraries in an alternate location (as above example), you'll need to make sure that the R_LIBS environment variable is set before each time Oncoscape is run. One way to accomplish this is to add the following line to your ~/.bash_profile replacing '/home/myhome/rlibs' with the path used for the alternate R library path: 

```bash
export R_LIBS=/home/myhome/rlibs
```

After the application has been successfully built, you should test it to ensure that everything is working as expected. This an be accomplished by running the provided test. Before running the test suite (or running the Oncoscape app itself), you'll need to create a direcotry to store user data and export it as follows (replace <path> with the actual path): 

```bash
sudo mkdir /<path>/userdata
export ONCOSCAPE_USER_DATA_STORE=file:///<path>/userdata
```
With the userdata directory in place and environment variable exported the test suite can be executed with the following command:

```bash
make test
```

If all tests passed (you should see "OK:  all python websocket json tests passed") you are ready to proceed to running Oncoscape.


### Windows Build and Install Instructions

***NOTE***: Oncoscape uses a Unix tool-chain to build, test, install and run. Many of these tools are not native to the Windows platform so Oncoscape will currently not work out of the box on Windows. We are planning to offer instructions for the Windows platform soon.

# 3. Oncoscape Configuration (all platforms)

The default Oncoscape configuration file is located at 'Oncoscape/inst/scripts/apps/oncoscape/runOncoscapeApp-7777.R' 

Edit this file to meet your specific needs, such the TCP port you wan the server to listen on and what datasets you want to load on startup. By default when run Oncoscape will automatically open a web browser and navigate to the Oncoscape application. If you are running Oncoscape on a remote server rather than your workstation, you'll want to replace "yourservername" in this file to match the hostname of your server.

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

# 4. Running Oncoscape

### Running a Global Installation

If you performed a system-wide install of the Oncoscape R libraries (make install) the following command will kill any current running Oncoscape instances and launch Oncoscape as defined in the configuration file:

```bash
make oncoApp7777
```

### Running a Local Installation

If you installed the Oncoscape R packages in a defined location (make installLocal) the following command will kill any current running Oncoscape instances and launch Oncoscape as defined in the configuration file:

```bash
make oncoAppLocal7777
```

After the Oncoscape application has started, a web browser should open and automatically navigate to the Oncoscape application. If you are running Oncoscape on a remote server, you'll need open a web browser and navigate to the Oncoscape application. Example URL if using the default port:

> http://yourservername.com:7777

After launching Oncoscape, it takes about 15 seconds before it starts listening for connections, so be patient.

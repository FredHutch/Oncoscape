# Use Ubuntu 14.04 as the base container
FROM ubuntu:14.04

MAINTAINER "Robert McDermott" robert.c.mcdermott@gmail.com

# ADD the CRAN Repo to the apt sources list
RUN echo "deb http://cran.fhcrc.org/bin/linux/ubuntu trusty/" > /etc/apt/sources.list.d/cran.fhcrc.org.list
# Add the package verification key
RUN apt-key adv --keyserver keyserver.ubuntu.com --recv-keys 51716619E084DAB9

# Update the system and install packages
RUN apt-get -y update && apt-get -y install \
	r-base=3.2.2* \
	vim \
	make \
	m4 \
	gcc \
	g++ \
	libxml2 \
	libxml2-dev \
        python-pip && \
        pip install websocket-client 

# create the sttrweb user and data directory
RUN useradd -u 7534 -m -d /home/sttrweb -c "sttr web application" sttrweb && \
	mkdir /home/sttrweb/data && \
	mkdir /home/sttrweb/Oncoscape && \
	mkdir /home/sttrweb/rlib 

# Set environment variable for Oncoscape data location
ENV ONCOSCAPE_USER_DATA_STORE file:///home/sttrweb/data
ENV R_LIBS /home/sttrweb/rlib

ADD Oncoscape /home/sttrweb/Oncoscape/Oncoscape
ADD analysisPackages /home/sttrweb/Oncoscape/analysisPackages
ADD dataPackages /home/sttrweb/Oncoscape/dataPackages
ADD installBioconductorPackages.R /home/sttrweb/Oncoscape/
ADD installRpackages_global.sh /home/sttrweb/Oncoscape/
ADD installRpackages_local.sh /home/sttrweb/Oncoscape/
ADD testAllWebsocketOperations.py /home/sttrweb/Oncoscape/
ADD makefile /home/sttrweb/Oncoscape/

WORKDIR /home/sttrweb/Oncoscape

RUN make install
RUN chown -R sttrweb:sttrweb /home/sttrweb 

EXPOSE 7777

USER sttrweb

CMD export R_LIBS=/home/sttrweb/rlib && make oncoDocker

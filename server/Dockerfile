# Use Ubuntu 14.04 as the base container
FROM ubuntu:14.04

# ADD the CRAN Repo to the apt sources list
RUN echo "deb http://cran.fhcrc.org/bin/linux/ubuntu trusty/" > /etc/apt/sources.list.d/cran.fhcrc.org.list

# Add the package verification key
RUN apt-key adv --keyserver keyserver.ubuntu.com --recv-keys 51716619E084DAB9

# Update the system and install packages


RUN apt-get -y -qq update && apt-get -y -qq install \
	r-base=3.2.3* \
	vim \
	make \
	m4 \
	gcc \
	g++ \
	libxml2 \
	libxml2-dev \
	python-pip 

RUN curl -sL https://deb.nodesource.com/setup_0.12 | bash -

RUN apt-get -y -qq update && apt-get -y -qq install nodejs
	

# Create the sttrweb user and data directory
RUN useradd -u 7534 -m -d /home/sttrweb -c "sttr web application" sttrweb && \
	mkdir /home/sttrweb/data && \
	mkdir /home/sttrweb/Oncoscape && \
	mkdir /home/sttrweb/rlib 

# Set environment variable for Oncoscape data location
ENV ONCOSCAPE_USER_DATA_STORE file:///home/sttrweb/data

# Install R Modules
ADD r_modules /home/sttrweb/Oncoscape/r_modules
WORKDIR /home/sttrweb/Oncoscape/r_modules
RUN make install

# Install Node Modules
ADD server /home/sttrweb/Oncoscape/server
WORKDIR /home/sttrweb/Oncoscape/server
#RUN npm install 

EXPOSE  80
CMD ["bash"]
#CMD ["node", "start.js"]
# Use Ubuntu 14.04 as the base container
FROM ubuntu:14.04

# Import MongoDB public GPG key AND create a MongoDB list file
RUN apt-key adv --keyserver keyserver.ubuntu.com --recv 7F0CEB10
RUN echo "deb http://repo.mongodb.org/apt/ubuntu "$(lsb_release -sc)"/mongodb-org/3.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-3.0.list



# ADD the CRAN Repo to the apt sources list
RUN echo "deb http://cran.fhcrc.org/bin/linux/ubuntu trusty/" > /etc/apt/sources.list.d/cran.fhcrc.org.list

# Add the package verification key
RUN apt-key adv --keyserver keyserver.ubuntu.com --recv-keys 51716619E084DAB9

# Update the system and install packages
RUN apt-get -y -qq update && apt-get -y -qq install \

	r-base=3.2.2* \
	r-recommended=3.2.2-1trusty0* \
	make \
	gcc \
	g++ \
	libxml2 \
	libxml2-dev \
	python-pip \
	mongodb-org

#Create the MongoDB data directory
VOLUME ["/data/db"]
WORKDIR /data

# Install latest version of Node 5.x
RUN curl -sL https://deb.nodesource.com/setup_5.x | bash -
RUN apt-get -y install nodejs

# Create the sttrweb user and data directory
RUN useradd -u 7534 -m -d /home/sttrweb -c "sttr web application" sttrweb && \
	mkdir /home/sttrweb/data && \
	mkdir /home/sttrweb/Oncoscape && \
	mkdir /home/sttrweb/rlib 

# Install R Modules
ADD r_modules /home/sttrweb/Oncoscape/r_modules
WORKDIR /home/sttrweb/Oncoscape/r_modules
RUN make install

# Install Node Server + Modules
ADD server /home/sttrweb/Oncoscape/server
WORKDIR /home/sttrweb/Oncoscape/server
RUN npm install

# Install Rstats
WORKDIR /home/sttrweb/Oncoscape/server/rstats
RUN npm install -g node-gyp && node-gyp configure build 

EXPOSE 27017 # Mongo
EXPOSE  80 # Http

# Switch to the server directory and start it up
WORKDIR /home/sttrweb/Oncoscape/server

CMD ["mongod"]
CMD ["node", "start.js",]

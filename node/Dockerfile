# Use Ubuntu 14.04 as the base container
FROM ubuntu:14.04

# Add the package verification key
RUN apt-key adv --keyserver keyserver.ubuntu.com --recv-keys 51716619E084DAB9

# Update the system and install packages
RUN apt-get -y -qq update && apt-get -y -qq install \
	apt-transport-https \
	make \
	gcc \
	g++ \
	libxml2 \
	libxml2-dev \
	python-pip \
	curl \
	nano

# Install Node 6.x
RUN curl -sL https://deb.nodesource.com/setup_6.x | bash -
RUN apt-get -y -qq install nodejs

# Install PM2
RUN npm install -g pm2

# Set Working Directory + Copy Code Into Container
WORKDIR /home/sttrweb/Oncoscape
ADD app.js /home/sttrweb/Oncoscape
ADD package.json /home/sttrweb/Oncoscape

# Run NPM Install
RUN npm install

# Extenal Port
EXPOSE 8080

CMD ["pm2", "start", "/home/sttrweb/Oncoscape/app.js", "-i", "0", "--no-daemon"];

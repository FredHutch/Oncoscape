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
	nano \
	supervisor

# Install Varnish 4.0
RUN curl https://repo.varnish-cache.org/GPG-key.txt | apt-key add -
RUN echo "deb https://repo.varnish-cache.org/ubuntu/ trusty varnish-4.1" \ >> /etc/apt/sources.list.d/varnish-cache.list
RUN apt-get -y -qq update && apt-get -y -qq install varnish

# Install Node 6.x
RUN curl -sL https://deb.nodesource.com/setup_6.x | bash -
RUN apt-get -y -qq install nodejs

# Install PM2
RUN npm install -g pm2

# Create The "sttrweb" User + Web Directory
RUN useradd -u 7534 -m -d /home/sttrweb -c "sttr web application" sttrweb && \
	mkdir /home/sttrweb/Oncoscape

# Set Working Directory + Copy Code Into Container
WORKDIR /home/sttrweb/Oncoscape/server
ADD server /home/sttrweb/Oncoscape/server

# Run NPM Install
RUN npm install

# Extenal Port
EXPOSE 80

CMD ["/usr/bin/supervisord", "-n", "-c", "/home/sttrweb/Oncoscape/server/supervisord.conf"]

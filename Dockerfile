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
	nginx \
	supervisor

# Add NGinx Config + Cache Folder
ADD  /nginx.conf /etc/nginx/
RUN mkdir /data /data/nginx /data/nginx/cache

# Add Supervisord Config
Run mkdir /etc/supervisord
ADD  /supervisord.conf /etc/supervisord/

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

WORKDIR /home/sttrweb/Oncoscape/client
ADD client-build /home/sttrweb/Oncoscape/client

WORKDIR /home/sttrweb/Oncoscape

# Extenal Port
EXPOSE 80

CMD ["/usr/bin/supervisord", "-n", "-c", "/etc/supervisord/supervisord.conf"]
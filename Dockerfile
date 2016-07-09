# Use Ubuntu 14.04 as the base container
FROM ubuntu:14.04

# Add the package verification key
RUN apt-key adv --keyserver keyserver.ubuntu.com --recv-keys 51716619E084DAB9

# Configure Log Level
ENV NPM_CONFIG_LOGLEVEL production

# Install Node
RUN apt-get update && \
    apt-get -y install curl && \
    apt-get -y install git && \
    apt-get -y install wget && \
    curl -sL https://deb.nodesource.com/setup_6.x | sudo -E bash - && \
    apt-get install --yes nodejs

# Install PM2
RUN npm install -g pm2

# Create The "sttrweb" User + Web Directory
RUN useradd -u 7534 -m -d /home/sttrweb -c "sttr web application" sttrweb && \
	mkdir /home/sttrweb/Oncoscape

# Set Working Directory + Copy Code Into Container
WORKDIR /home/sttrweb/Oncoscape/server
ADD . /home/sttrweb/Oncoscape/server

# Run NPM Install
RUN npm install

# Extenal Port
EXPOSE  80

# Switch to the server directory and start it up
WORKDIR /home/sttrweb/Oncoscape/server

# Start PM2
CMD ["pm2", "start", "app.js", "--no-daemon"]
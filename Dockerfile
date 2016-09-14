# Use Ubuntu 14.04 as the base container
FROM ubuntu:14.04

# Set Environment Variables - These values are for test environment + are dynamically replaced upon deploy
ENV KONG_DATABASE=postgres \
	KONG_PG_HOST=140.107.117.18 \
	KONG_PG_PORT=32023 \
	KONG_PG_USER=GBdh62FfCvwtnqey \
	KONG_PG_PASSWORD=hUDrQe7m5fXKprJC \
	KONG_PG_DATABASE=OncoGateway \
	KONG_ADMIN_LISTEN=127.0.0.1:8001 \
	MONGO_CONNECTION=mongodb://oncoscape-dev-db1.sttrcancer.i1f4d9botHD4xnZ:27017,oncoscape-dev-db2.sttrcancer.io:27017,oncoscape-dev-db3.sttrcancer.io:27017/pancan12?authSource=admin \
	MONGO_USERNAME=oncoscapeRead \
	MONGO_PASSWORD=i1f4d9botHD4xnZ \
	MONGO_DOMAIN=https://dev.oncoscape.sttrcancer.io \
	HT_USERNAME=admin \
	HT_PASSWORD=password \
	NODE_PORT=8002 \
	NODE_DEBUG=0

# Add Standard Packages + Verification Key
RUN apt-key adv --keyserver keyserver.ubuntu.com --recv-keys 51716619E084DAB9
RUN apt-get -y -qq update && apt-get -y -qq install \
	netcat \
	openssl \
	apache2 \
	apache2-utils \
	libpcre3 \
	dnsmasq \
	procps \
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

# Install Kong
RUN curl -sL https://github.com/Mashape/kong/releases/download/0.9.0/kong-0.9.0.trusty_all.deb > kong-0.9.0.trusty_all.deb  && \
	dpkg -i kong-0.9.0.trusty_all.deb

# Install Node 6.x + PM2
RUN curl -sL https://deb.nodesource.com/setup_6.x | bash -
RUN apt-get -y -qq install nodejs
RUN npm install -g pm2

# Install OpenCPU
RUN \
  apt-get update && \
  apt-get -y dist-upgrade && \
  apt-get install -y software-properties-common && \
  add-apt-repository -y ppa:opencpu/opencpu-1.6 && \
  apt-get update && \
  apt-get install -y opencpu
RUN truncate -s 0 /etc/apache2/ports.conf
RUN echo "ServerName localhost" >> /etc/apache2/apache2.conf


# Create Application User
RUN useradd -u 7534 -m -d /home/sttrweb -c "sttr web application" sttrweb && \
	mkdir /home/sttrweb/Oncoscape

# Copy App Code + Run NPM Install
COPY client-build /home/sttrweb/Oncoscape/client
COPY server /home/sttrweb/Oncoscape/server
WORKDIR /home/sttrweb/Oncoscape/server/
RUN npm install

# Copy Config Files
WORKDIR /home/sttrweb/Oncoscape/
COPY /docker-kong.conf /home/sttrweb/Oncoscape/
COPY /docker-nginx.template /home/sttrweb/Oncoscape/
COPY /docker-supervisord.conf /home/sttrweb/Oncoscape/
COPY /docker-entrypoint.sh /home/sttrweb/Oncoscape/

# Expose Ports
EXPOSE 80 8000 8001 8003 8004

# Fire It Up
RUN chmod +x /home/sttrweb/Oncoscape/docker-entrypoint.sh
ENTRYPOINT ["/home/sttrweb/Oncoscape/docker-entrypoint.sh"]
#CMD ["/usr/bin/supervisord", "-n", "-c", "/home/sttrweb/Oncoscape/docker-supervisord.conf"]
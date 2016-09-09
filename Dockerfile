# Build Run
# docker run -d --name kong-database -p 5432:5432 -e "POSTGRES_USER=kong" -e "POSTGRES_DB=kong" postgres:9.4
# docker build -t kong/oncoscape .
# docker run -t -i -p 80 --name web kong/oncoscape bash
# /usr/bin/supervisord -n -c /etc/supervisord/supervisord-kong.conf

# Use Ubuntu 14.04 as the base container
FROM ubuntu:14.04

# Add the package verification key
RUN apt-key adv --keyserver keyserver.ubuntu.com --recv-keys 51716619E084DAB9
RUN apt-get -y -qq update && apt-get -y -qq install \
	netcat \
	openssl \
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

# Install OpenCPU
RUN \
  apt-get update && \
  apt-get -y dist-upgrade && \
  apt-get install -y software-properties-common && \
  add-apt-repository -y ppa:opencpu/opencpu-1.6 && \
  apt-get update && \
  apt-get install -y opencpu

# Install Kong
RUN curl -sL https://github.com/Mashape/kong/releases/download/0.9.0/kong-0.9.0.trusty_all.deb > kong-0.9.0.trusty_all.deb
RUN dpkg -i kong-0.9.0.trusty_all.deb
ENV KONG_DATABASE=postgres
ENV KONG_PG_HOST=140.107.117.18
ENV KONG_PG_PORT=32023
ENV KONG_PG_USER=GBdh62FfCvwtnqey
ENV KONG_PG_PASSWORD=hUDrQe7m5fXKprJC
ENV KONG_PG_DATABASE=OncoGateway
ENV KONG_ADMIN_LISTEN=127.0.0.1:8001

# Install Node 6.x
RUN curl -sL https://deb.nodesource.com/setup_6.x | bash -
RUN apt-get -y -qq install nodejs

# Install PM2
RUN npm install -g pm2

# Add Kong Config
ADD /kong.conf /etc/kong/

# Add NGinx Config 
ADD  /nginx-kong-oncoscape.template /usr/local/kong/

# Add OpenCPU Config
ADD /opencpu.conf /etc/apache2/sites-available/

# Create Folder To Hold NGinx Cache
RUN mkdir /data /data/nginx /data/nginx/cache

# Add Supervisord Config
Run mkdir /etc/supervisord
ADD  /supervisord-kong.conf /etc/supervisord/

# Create The "sttrweb" User + Web Directory
RUN useradd -u 7534 -m -d /home/sttrweb -c "sttr web application" sttrweb && \
	mkdir /home/sttrweb/Oncoscape

# Add Server Side Code
WORKDIR /home/sttrweb/Oncoscape/server
ADD node /home/sttrweb/Oncoscape/server
RUN npm install

# Add Client Side Code
WORKDIR /home/sttrweb/Oncoscape/client
ADD client-build /home/sttrweb/Oncoscape/client

# Create HtPassword For Secure Resources
RUN sh -c "echo -n 'admin:' >> /home/sttrweb/Oncoscape/.htpasswd" && \
	sh -c "openssl p@ssw0rd -apr1 >> /home/sttrweb/Oncoscape/.htpasswd"

# Set Working Dir
WORKDIR /home/sttrweb/Oncoscape/

# Extenal Port
EXPOSE 80

# Start Supervisor
CMD ["/usr/bin/supervisord", "-n", "-c", "/etc/supervisord/supervisord-kong.conf"]
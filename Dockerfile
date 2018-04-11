# Use Ubuntu 14.04 as the base container
FROM ubuntu:14.04

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
RUN curl -sL https://github.com/Mashape/kong/releases/download/0.9.4/kong-0.9.4.trusty_all.deb > kong-0.9.4.trusty_all.deb  && \
	dpkg -i kong-0.9.4.trusty_all.deb

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
	mkdir /home/sttrweb/Oncoscape && \
	mkdir /home/sttrweb/Oncoscape/cache && \
	mkdir /var/log/nginx/

# Install Client Code
COPY client-build /home/sttrweb/Oncoscape/client
COPY documentation/dist /home/sttrweb/Oncoscape/documentation

# Install Server Code
COPY server /home/sttrweb/Oncoscape/server
WORKDIR /home/sttrweb/Oncoscape/server/
RUN npm install

# Install R Package
# COPY cpu/oncoscape_0.1.0.tgz /home/sttrweb/Oncoscape/oncoscape_0.1.0.tgz
# WORKDIR /home/sttrweb/Oncoscape/
# RUN R CMD INSTALL oncoscape_0.1.0.tgz --library=/usr/local/lib/R/site-library
# RUN echo "r <- getOption('repos'); r['CRAN'] <- 'http://cran.us.r-project.org'; options(repos = r);" > ~/.Rprofile
# RUN Rscript -e "install.packages(c('devtools','ggplot2','gridSVG','d3heatmap','pls'))"

# Copy Config Files
WORKDIR /home/sttrweb/Oncoscape/
COPY /docker-kong.template /home/sttrweb/Oncoscape/
COPY /docker-nginx.template /home/sttrweb/Oncoscape/
COPY /docker-supervisord.conf /home/sttrweb/Oncoscape/
COPY /docker-entrypoint.sh /home/sttrweb/Oncoscape/

# Expose Ports
EXPOSE 80 7946 8000 8001 8003 8004 
EXPOSE 7946/udp

# Fire It Up
RUN chmod +x /home/sttrweb/Oncoscape/docker-entrypoint.sh
ENTRYPOINT ["/home/sttrweb/Oncoscape/docker-entrypoint.sh"]
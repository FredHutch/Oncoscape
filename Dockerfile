FROM fredhutch/oncoscape-base:latest

MAINTAINER "Robert McDermott" robert.c.mcdermott@gmail.com

# Create the sttrweb user and data directory
RUN useradd -u 7534 -m -d /home/sttrweb -c "sttr web application" sttrweb && \
	mkdir /home/sttrweb/data && \
	mkdir /home/sttrweb/Oncoscape && \
	mkdir /home/sttrweb/rlib 

# Set environment variable for Oncoscape data location
ENV ONCOSCAPE_USER_DATA_STORE file:///home/sttrweb/data
#ENV R_LIBS /home/sttrweb/rlib

ADD Oncoscape /home/sttrweb/Oncoscape/Oncoscape
ADD analysisPackages /home/sttrweb/Oncoscape/analysisPackages
ADD dataPackages /home/sttrweb/Oncoscape/dataPackages
ADD installBioconductorPackages.R /home/sttrweb/Oncoscape/
ADD installRpackages_global.sh /home/sttrweb/Oncoscape/
ADD installRpackages_local.sh /home/sttrweb/Oncoscape/
ADD testAllWebsocketOperations.py /home/sttrweb/Oncoscape/
ADD makefile /home/sttrweb/Oncoscape/
ADD removeInstalledOncoscapePackages.R /home/sttrweb/Oncoscape/

WORKDIR /home/sttrweb/Oncoscape

#RUN chown -R sttrweb:sttrweb /home/sttrweb 

#USER sttrweb

RUN make install

EXPOSE 7777

CMD make oncoDocker

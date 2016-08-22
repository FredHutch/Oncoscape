FROM ubuntu:14.04

# Install
RUN \
  apt-get update && \
  apt-get -y dist-upgrade && \
  apt-get install -y software-properties-common && \
  add-apt-repository -y ppa:opencpu/opencpu-1.6 && \
  apt-get update && \
  apt-get install -y opencpu

# Apache Ports
EXPOSE 80

# Start
CMD service opencpu restart && tail -F /var/log/opencpu/apache_access.log
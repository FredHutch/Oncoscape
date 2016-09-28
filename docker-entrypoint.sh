#!/bin/sh

# Create Password To Secure Private Upstream Servers
htpasswd -b -c /home/sttrweb/Oncoscape/.htpasswd $HT_USERNAME $HT_PASSWORD

# Export Container Id - Conditional Logic Required Due to Issue With DockerCloud Overlay Network
export kong_container_ip="$(ifconfig | grep -A 1 'eth0' | tail -1 | cut -d ':' -f 2 | cut -d ' ' -f 1)";
case $HOSTNAME in
  "oncoscape-dev-1") export kong_container_ip="172.17.12.120";;
  "oncoscape-dev-2") export kong_container_ip="172.17.12.29";;
esac

# Inject Environment Vars Into Config
envsubst < /home/sttrweb/Oncoscape/docker-kong.template > /home/sttrweb/Oncoscape/docker-kong.conf

# Start
/usr/bin/supervisord -n -c /home/sttrweb/Oncoscape/docker-supervisord.conf

#!/bin/sh
htpasswd -b -c /home/sttrweb/Oncoscape/.htpasswd $HT_USERNAME $HT_PASSWORD
export kong_container_ip="$(ifconfig | grep -A 1 'eth0' | tail -1 | cut -d ':' -f 2 | cut -d ' ' -f 1)"
envsubst < /home/sttrweb/Oncoscape/docker-kong.template > /home/sttrweb/Oncoscape/docker-kong.conf
/usr/bin/supervisord -n -c /home/sttrweb/Oncoscape/docker-supervisord.conf
#!/bin/sh
htpasswd -b -c /home/sttrweb/Oncoscape/.htpasswd $HT_USERNAME $HT_PASSWORD
#export kong_container_ip=`ifconfig eth0 2>/dev/null|awk '/inet addr:/ {print $2}'|sed 's/addr://'`
envsubst < /home/sttrweb/Oncoscape/docker-kong.template > /home/sttrweb/Oncoscape/docker-kong.conf
/usr/bin/supervisord -n -c /home/sttrweb/Oncoscape/docker-supervisord.conf
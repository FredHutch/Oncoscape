#!/bin/sh
htpasswd -b -c /home/sttrweb/Oncoscape/.htpasswd $HT_USERNAME $HT_PASSWORD
envsubst < /home/sttrweb/Oncoscape/docker-kong.template > /home/sttrweb/Oncoscape/docker-kong.conf
/usr/bin/supervisord -n -c /home/sttrweb/Oncoscape/docker-supervisord.conf
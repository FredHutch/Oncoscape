#!/bin/sh
htpasswd -b -c /home/sttrweb/Oncoscape/.htpasswd $HT_USERNAME $HT_PASSWORD
/usr/bin/supervisord -n -c /home/sttrweb/Oncoscape/docker-supervisord.conf
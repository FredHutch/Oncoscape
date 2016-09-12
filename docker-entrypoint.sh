#!/bin/sh
htpasswd -b -c /home/sttrweb/Oncoscape/.htpasswd admin password
/usr/bin/supervisord -n -c /etc/supervisord/docker-supervisord.conf
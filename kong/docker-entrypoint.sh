#!/bin/bash
set -e

# Give the database time to startup and initialize
sleep 30

# Setting up the proper database
if [ -n "$DATABASE" ]; then
  echo -e '\ndatabase: "'$DATABASE'"' >> /etc/kong/kong.yml
fi

exec "$@"
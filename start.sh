#! /bin/sh 

echo "Starting Server" >&2
cd ./server/
node start.js &&

echo "Starting Gulp" >&2
cd ../client/
gulp serve
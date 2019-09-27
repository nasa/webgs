#!/bin/bash
npm install
if [ $1 ];
then node_modules/http-server/bin/http-server $@
else node_modules/http-server/bin/http-server -p 8082
fi

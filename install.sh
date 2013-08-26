#!/bin/bash

# This file downloads the current selenium-server-standalone file from
# the googlecode project repository

# check if .bin directory exists
if [ ! -d "../.bin" ]; then
  mkdir ../.bin
fi

# go into .bin directory
cd ../.bin

# log action
echo "Download selenium-server-standalone-2.35.0.jar into node_modules/.bin ....\n"

# download selenium server standalone
curl -O https://selenium.googlecode.com/files/selenium-server-standalone-2.35.0.jar
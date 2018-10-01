#!/bin/bash
docker build -t webdriverio .
docker build tag webdriverio:latest uzzal2k5/webdriverio:latest 
#docker push uzzal2k5/webdriverio:latest 

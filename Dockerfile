FROM node:8.12.0
LABEL MAINTAINER="uzzal, https://www.linkedin.com/in/uzzal2k5/ "
WORKDIR /webdriverio
COPY .  .

# INSTALL ALL REQUIRE PACKAGES
RUN npm install
RUN npm run setup

# CONFIG STANDARD ERROR LOG
RUN ln -sf /dev/stdout /var/log/access.log \
	&& ln -sf /dev/stderr /var/log/error.log

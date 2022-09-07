# [Choice] Node.js version (use -bullseye variants on local arm64/Apple Silicon): 18, 16, 14, 18-bullseye, 16-bullseye, 14-bullseye, 18-buster, 16-buster, 14-buster
ARG VARIANT=16-bullseye
FROM mcr.microsoft.com/vscode/devcontainers/javascript-node:0-${VARIANT}

# RUN \
    # curl https://packages.microsoft.com/keys/microsoft.asc | gpg --dearmor > microsoft.gpg && \
    # sudo install -o root -g root -m 644 microsoft.gpg /etc/apt/trusted.gpg.d/
    # sudo sh -c 'echo "deb [arch=amd64] https://packages.microsoft.com/repos/edge stable main" > /etc/apt/sources.list.d/microsoft-edge-stable.list' && \
    # sudo rm microsoft.gpg && \
RUN \
    sudo apt-get update && \
    sudo apt-get install -y \
        # install manually all the missing libraries
        gconf-service libasound2 libatk1.0-0 libcairo2 libcups2 \
        libfontconfig1 libgdk-pixbuf2.0-0 libgtk-3-0 libnspr4 libpango-1.0-0 \
        libxss1 fonts-liberation libnss3 lsb-release xdg-utils

# install chrome
RUN \
    wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb && \
    dpkg -i google-chrome-stable_current_amd64.deb; apt-get -fy install

# install firefox
RUN \
    wget -O firefoxsetup.tar.bz2 "https://download.mozilla.org/?product=firefox-latest&os=linux64&lang=en-US" && \
    sudo tar -xf firefoxsetup.tar.bz2 --directory /opt

# install global NPM packages
RUN \
    npm i -g http-server diff-so-fancy chromedriver@105 geckodriver

# [Choice] Node.js version (use -bullseye variants on local arm64/Apple Silicon): 18, 16, 14, 18-bullseye, 16-bullseye, 14-bullseye, 18-buster, 16-buster, 14-buster
ARG VARIANT=16-bullseye
FROM mcr.microsoft.com/vscode/devcontainers/javascript-node:0-${VARIANT}

COPY library-scripts/meta.env /usr/local/etc/vscode-dev-containers
RUN \
    curl https://packages.microsoft.com/keys/microsoft.asc | gpg --dearmor > microsoft.gpg && \
    sudo install -o root -g root -m 644 microsoft.gpg /etc/apt/trusted.gpg.d/ && \
    sudo sh -c 'echo "deb [arch=amd64] https://packages.microsoft.com/repos/edge stable main" > /etc/apt/sources.list.d/microsoft-edge-dev.list' && \
    sudo rm microsoft.gpg && \
    sudo apt-get update && \
    sudo apt-get install -y \
        chromium-browser \
        firefox \
        microsoft-edge-dev

RUN \
    npm i -g http-server diff-so-fancy chromedriver@103 geckodriver

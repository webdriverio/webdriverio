FROM gitpod/workspace-node-lts

RUN \
    sudo apt-get update && \
    sudo apt-get install -y \
        chromium-browser

RUN \
    npm i -g http-server diff-so-fancy

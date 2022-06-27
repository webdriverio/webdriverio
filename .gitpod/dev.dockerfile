FROM gitpod/workspace-node

RUN \
    sudo apt-get update && \
    sudo apt-get install -y \
        chromium-browser

RUN \
    npm i -g http-server diff-so-fancy

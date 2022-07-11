FROM gitpod/workspace-node

RUN \
    sudo apt-get update && \
    sudo apt-get install -y \
        chromium-browser

RUN \
    nvm install && \
    npm i -g http-server diff-so-fancy chromedriver@101

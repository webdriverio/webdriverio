FROM gitpod/workspace-node

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

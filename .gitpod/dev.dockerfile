FROM gitpod/workspace-full

RUN \
    sudo apt-get update && \
    sudo apt-get install -y && \
    wget -P /tmp https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb && \
    sudo dpkg -i /tmp/google-chrome-stable_current_amd64.deb && \
    sudo apt-get install -f --yes
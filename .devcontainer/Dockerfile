FROM mcr.microsoft.com/devcontainers/javascript-node:18

RUN apt-get update && export DEBIAN_FRONTEND=noninteractive && apt-get install -y firefox-esr

RUN apt-get update && export DEBIAN_FRONTEND=noninteractive \
    && curl -sSL https://dl.google.com/linux/direct/google-chrome-stable_current_$(dpkg --print-architecture).deb -o /tmp/chrome.deb \
    && apt-get -y install /tmp/chrome.deb

ENV PATH="/opt/google/chrome:${PATH}"
ENV IS_DEVCONTAINER=1

RUN npm i -g http-server diff-so-fancy chromedriver@105 geckodriver
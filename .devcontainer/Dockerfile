FROM mcr.microsoft.com/devcontainers/javascript-node:0-18

# Installs Firefox ESR
RUN apt-get update && export DEBIAN_FRONTEND=noninteractive && apt-get install -y firefox-esr

# Installs full version of Google Chrome
RUN wget https://dl.google.com/linux/direct/google-chrome-stable_current_$(dpkg --print-architecture).deb \
	&& dpkg -i google-chrome-stable_current_$(dpkg --print-architecture).deb; apt-get -fy install

ENV PATH="/opt/google/chrome:${PATH}"

# Installs Microsoft Edge
RUN if [[ $(dpkg --print-architecture) == "amd64" ]]; then \
        curl https://packages.microsoft.com/keys/microsoft.asc | gpg --dearmor > microsoft.gpg && \
        install -o root -g root -m 644 microsoft.gpg /etc/apt/trusted.gpg.d/ && \
        sh -c 'echo "deb [arch=amd64] https://packages.microsoft.com/repos/edge stable main" > /etc/apt/sources.list.d/microsoft-edge-dev.list' && \
        rm microsoft.gpg && \
        apt-get update && \
        apt-get install -y microsoft-edge-stable ; \
	fi

RUN npm i -g \
		http-server \
		diff-so-fancy \
		chromedriver@105 \
		geckodriver

COPY welcome-message.txt /usr/local/etc/vscode-dev-containers/first-run-notice.txt

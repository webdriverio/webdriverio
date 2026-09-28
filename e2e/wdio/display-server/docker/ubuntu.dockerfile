ARG UBUNTU_VERSION=26.04
FROM ubuntu:${UBUNTU_VERSION}

# Avoid interactive prompts during installation
ENV DEBIAN_FRONTEND=noninteractive
ENV CI=true

# Set per CI matrix cell. BREAK_WESTON deletes Weston's headless backend so it exits at startup.
ARG WESTON=
ARG XVFB=
ARG BREAK_WESTON=

RUN apt-get update -qq && \
    apt-get install -y \
        curl \
        ca-certificates \
        gnupg \
        sudo \
        ${WESTON:+weston} \
        ${XVFB:+xvfb} && \
    if [ -n "$BREAK_WESTON" ]; then test -n "$(find /usr/lib -name headless-backend.so -print -delete)"; fi && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Install Chrome for testing
RUN curl -fsSL https://dl.google.com/linux/linux_signing_key.pub | gpg --dearmor -o /usr/share/keyrings/google-chrome-keyring.gpg && \
    echo "deb [arch=amd64 signed-by=/usr/share/keyrings/google-chrome-keyring.gpg] http://dl.google.com/linux/chrome/deb/ stable main" > /etc/apt/sources.list.d/google-chrome.list && \
    apt-get update -qq && \
    apt-get install -y google-chrome-stable && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Install Node.js from NodeSource
RUN curl -fsSL https://deb.nodesource.com/setup_22.x | bash - && \
    apt-get install -y nodejs

RUN npm install -g pnpm@11.27.1

RUN useradd -m -s /bin/bash testuser && \
    echo 'testuser ALL=(ALL) NOPASSWD:ALL' >> /etc/sudoers

WORKDIR /app
USER testuser

CMD ["bash"]

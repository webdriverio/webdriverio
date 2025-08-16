FROM debian:12

# Avoid interactive prompts during installation
ENV DEBIAN_FRONTEND=noninteractive
ENV CI=true

# Install requirements including xvfb
RUN apt-get update -qq && \
    apt-get install -y \
        curl \
        ca-certificates \
        gnupg \
        sudo \
        xvfb && \
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

# Install pnpm globally as root
RUN npm install -g pnpm

# Verify xvfb-run is available
RUN which xvfb-run

# Create test user with sudo access
RUN useradd -m -s /bin/bash testuser && \
    echo 'testuser ALL=(ALL) NOPASSWD:ALL' >> /etc/sudoers

WORKDIR /app
USER testuser

# Default command
CMD ["bash"]

FROM debian:12

# Avoid interactive prompts during installation
ENV DEBIAN_FRONTEND=noninteractive
ENV CI=true

# Install basic requirements but explicitly NOT xvfb
RUN apt-get update -qq && \
    apt-get install -y \
        curl \
        ca-certificates \
        gnupg \
        sudo && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Install Chrome for testing
RUN curl -fsSL https://dl.google.com/linux/linux_signing_key.pub | gpg --dearmor -o /usr/share/keyrings/google-chrome-keyring.gpg && \
    echo "deb [arch=amd64 signed-by=/usr/share/keyrings/google-chrome-keyring.gpg] http://dl.google.com/linux/chrome/deb/ stable main" > /etc/apt/sources.list.d/google-chrome.list && \
    apt-get update -qq && \
    apt-get install -y google-chrome-stable && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Install Node.js 22 (latest LTS)
RUN curl -fsSL https://deb.nodesource.com/setup_22.x | bash - && \
    apt-get install -y nodejs

# Install pnpm globally as root
RUN npm install -g pnpm

# Create test user with sudo access
RUN useradd -m -s /bin/bash testuser && \
    echo 'testuser ALL=(ALL) NOPASSWD:ALL' >> /etc/sudoers

# Ensure clean environment by removing any xvfb packages (do this at the very end)
RUN apt-get update -qq && \
    apt-get remove -y xvfb xvfb-run xserver-xorg-video-dummy xserver-xorg-core xorg || true && \
    apt-get autoremove -y && \
    rm -f /usr/bin/xvfb-run /usr/local/bin/xvfb-run && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Verify xvfb-run is NOT available
RUN ! which xvfb-run || exit 1

WORKDIR /app
USER testuser

# Default command
CMD ["bash"]

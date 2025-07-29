FROM voidlinux/voidlinux:latest

# Set environment variables
ENV CI=true

# Update package index
RUN xbps-install -Su

# Install requirements including xvfb
RUN xbps-install -y \
        curl \
        ca-certificates \
        sudo \
        nodejs22 \
        npm \
        bash \
        which \
        xvfb \
        unzip \
        glibc

# Install pnpm globally as root
RUN npm install -g pnpm

# Install Chromium for testing
RUN xbps-install -y chromium

# Set Chrome binary path for Void (uses chromium)
ENV CHROME_BIN=/usr/bin/chromium

# Verify xvfb-run is available
RUN which xvfb-run

# Create test user with sudo access
RUN useradd -m -s /bin/bash testuser && \
    echo 'testuser ALL=(ALL) NOPASSWD:ALL' >> /etc/sudoers

WORKDIR /app
USER testuser

# Default command
CMD ["bash"]

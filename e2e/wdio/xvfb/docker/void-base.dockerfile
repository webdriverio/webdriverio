FROM voidlinux/voidlinux:latest

# Set environment variables
ENV CI=true

# Update package index
RUN xbps-install -Su

# Install basic requirements but explicitly NOT xvfb
RUN xbps-install -y \
        curl \
        ca-certificates \
        sudo \
        nodejs22 \
        npm \
        bash \
        which \
        unzip \
        glibc

# Install pnpm globally as root
RUN npm install -g pnpm

# Install Chromium for testing
RUN xbps-install -y chromium

# Set Chrome binary path for Void (uses chromium)
ENV CHROME_BIN=/usr/bin/chromium

# Create test user with sudo access
RUN useradd -m -s /bin/bash testuser && \
    echo 'testuser ALL=(ALL) NOPASSWD:ALL' >> /etc/sudoers

# Ensure clean environment by removing any xvfb packages (do this at the very end)
RUN xbps-remove -y xvfb xorg-server-xvfb || true && \
    rm -f /usr/bin/xvfb-run /usr/local/bin/xvfb-run

# Verify xvfb-run is NOT available
RUN ! which xvfb-run || exit 1

WORKDIR /app
USER testuser

# Default command
CMD ["bash"]

FROM voidlinux/voidlinux:latest

# Set environment variables
ENV CI=true

# Fix repository configuration, update XBPS, and install packages in one step
RUN echo 'repository=https://repo-default.voidlinux.org/current' > /etc/xbps.d/00-repository-main.conf && \
    xbps-install -Sy && \
    xbps-install -yu xbps && \
    xbps-install -Sy && \
    xbps-install -y \
        curl \
        ca-certificates \
        sudo \
        nodejs \
        bash \
        which \
        xvfb-run \
        unzip \
        glibc \
        chromium

# Install pnpm globally as root
RUN npm install -g pnpm

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

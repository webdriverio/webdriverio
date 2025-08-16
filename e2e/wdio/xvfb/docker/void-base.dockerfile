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
        unzip \
        glibc \
        chromium

# Install pnpm globally as root
RUN npm install -g pnpm

# Set Chrome binary path for Void (uses chromium)
ENV CHROME_BIN=/usr/bin/chromium

# Create test user with sudo access
RUN useradd -m -s /bin/bash testuser && \
    echo 'testuser ALL=(ALL) NOPASSWD:ALL' >> /etc/sudoers

# Ensure clean environment by removing any xvfb packages (do this at the very end)
RUN xbps-remove -y xvfb-run || true && \
    rm -f /usr/bin/xvfb-run /usr/local/bin/xvfb-run

# Verify xvfb-run is NOT available
RUN ! which xvfb-run || exit 1

WORKDIR /app
USER testuser

# Default command
CMD ["bash"]

FROM ghcr.io/void-linux/void-glibc:latest

# Set environment variables
ENV CI=true
ENV CHROME_BIN=/usr/bin/chromium

# xbps needs an initial sync before any package install. Refresh keys so
# the sync can verify signatures on first run.
RUN xbps-install -Suy xbps && \
    xbps-install -Sy \
        bash \
        curl \
        ca-certificates \
        sudo \
        nodejs \
        npm \
        weston \
        chromium && \
    xbps-install -Scc

# Install pnpm globally as root
RUN npm install -g pnpm

# Create test user with sudo access
RUN useradd -m -s /bin/bash testuser && \
    echo 'testuser ALL=(ALL) NOPASSWD:ALL' >> /etc/sudoers

WORKDIR /app
USER testuser

# Default command
CMD ["bash"]

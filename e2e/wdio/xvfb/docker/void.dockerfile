FROM voidlinux/void-linux:latest

# Set environment variables
ENV CI=true

# Install requirements including Wayland (weston)
RUN xbps-install -Sy \
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

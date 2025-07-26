FROM archlinux:latest

# Set environment variables
ENV CI=true

# Update system and install requirements including xvfb
RUN pacman -Syu --noconfirm && \
    pacman -S --noconfirm \
        curl \
        ca-certificates \
        sudo \
        nodejs \
        npm \
        which \
        xorg-server-xvfb && \
    pacman -Scc --noconfirm

# Install pnpm globally as root
RUN npm install -g pnpm

# Install Chrome for testing (Arch doesn't have google-chrome in main repos, use chromium)
RUN pacman -S --noconfirm chromium

# Set Chrome binary path for Arch (uses chromium)
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
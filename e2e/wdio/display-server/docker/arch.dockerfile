FROM archlinux:latest

# Set environment variables
ENV CI=true
# google-chrome lives in the AUR; use chromium from the official extra repo
# instead. The wdio config honours CHROME_BIN to pick this up.
ENV CHROME_BIN=/usr/bin/chromium

# Install requirements including Wayland (weston)
RUN pacman -Sy --noconfirm \
        curl \
        ca-certificates \
        sudo \
        nodejs \
        npm \
        which \
        weston \
        chromium && \
    pacman -Scc --noconfirm

# Install pnpm globally as root
RUN npm install -g pnpm

# Create test user with sudo access
RUN useradd -m -s /bin/bash testuser && \
    echo 'testuser ALL=(ALL) NOPASSWD:ALL' >> /etc/sudoers

WORKDIR /app
USER testuser

# Default command
CMD ["bash"]

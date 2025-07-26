FROM archlinux:latest

# Set environment variables
ENV CI=true

# Update system and install basic requirements but explicitly NOT xvfb
RUN pacman -Syu --noconfirm && \
    pacman -S --noconfirm \
        curl \
        ca-certificates \
        sudo \
        nodejs \
        npm \
        which && \
    pacman -Scc --noconfirm

# Install pnpm globally as root
RUN npm install -g pnpm

# Install Chrome for testing
RUN pacman -S --noconfirm google-chrome

# Verify xvfb-run is NOT available  
RUN ! which xvfb-run || exit 1

# Create test user with sudo access
RUN useradd -m -s /bin/bash testuser && \
    echo 'testuser ALL=(ALL) NOPASSWD:ALL' >> /etc/sudoers

WORKDIR /app
USER testuser

# Default command
CMD ["bash"]
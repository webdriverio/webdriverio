FROM fedora:38

# Set environment variables
ENV CI=true

# Install requirements including xvfb
RUN dnf update -y && \
    dnf install -y \
        curl \
        ca-certificates \
        sudo \
        nodejs \
        npm \
        xorg-x11-server-Xvfb && \
    dnf clean all

# Verify xvfb-run is available
RUN which xvfb-run

# Create test user with sudo access
RUN useradd -m -s /bin/bash testuser && \
    echo 'testuser ALL=(ALL) NOPASSWD:ALL' >> /etc/sudoers

WORKDIR /app
USER testuser

# Default command
CMD ["bash"]
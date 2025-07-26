FROM rockylinux:9

# Set environment variables
ENV CI=true

# Install requirements including xvfb
RUN dnf update -y && \
    dnf install -y \
        curl \
        ca-certificates \
        sudo \
        xorg-x11-server-Xvfb && \
    dnf clean all

# Install Node.js 18 from NodeSource
RUN curl -fsSL https://rpm.nodesource.com/setup_18.x | bash - && \
    dnf install -y nodejs

# Install pnpm globally as root
RUN npm install -g pnpm

# Verify xvfb-run is available
RUN which xvfb-run

# Create test user with sudo access
RUN useradd -m -s /bin/bash testuser && \
    echo 'testuser ALL=(ALL) NOPASSWD:ALL' >> /etc/sudoers

WORKDIR /app
USER testuser

# Default command
CMD ["bash"]
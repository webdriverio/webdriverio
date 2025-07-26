FROM opensuse/leap:15.6

# Set environment variables
ENV CI=true

# Install basic requirements but explicitly NOT xvfb
RUN zypper refresh && \
    zypper install -y \
        curl \
        ca-certificates \
        sudo \
        nodejs18 \
        npm18 && \
    zypper clean -a

# Install pnpm globally as root
RUN npm install -g pnpm

# Verify xvfb-run is NOT available  
RUN ! which xvfb-run || exit 1

# Create test user with sudo access
RUN useradd -m -s /bin/bash testuser && \
    echo 'testuser ALL=(ALL) NOPASSWD:ALL' >> /etc/sudoers

WORKDIR /app
USER testuser

# Default command
CMD ["bash"]
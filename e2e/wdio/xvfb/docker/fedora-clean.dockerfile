FROM fedora:38

# Set environment variables
ENV CI=true

# Install basic requirements but explicitly NOT xvfb
RUN dnf update -y && \
    dnf install -y \
        curl \
        ca-certificates \
        sudo \
        nodejs \
        npm && \
    dnf clean all

# Verify xvfb-run is NOT available  
RUN ! which xvfb-run || exit 1

# Create test user with sudo access
RUN useradd -m -s /bin/bash testuser && \
    echo 'testuser ALL=(ALL) NOPASSWD:ALL' >> /etc/sudoers

WORKDIR /app
USER testuser

# Default command
CMD ["bash"]
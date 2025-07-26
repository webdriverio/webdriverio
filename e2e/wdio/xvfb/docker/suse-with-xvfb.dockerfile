FROM opensuse/leap:15.6

# Set environment variables
ENV CI=true

# Install requirements including xvfb
RUN zypper refresh && \
    zypper install -y \
        curl \
        ca-certificates \
        sudo \
        nodejs \
        npm \
        xorg-x11-server-Xvfb && \
    zypper clean -a

# Install pnpm globally as root
RUN npm install -g pnpm

# Install Chrome for testing
RUN zypper addrepo -f http://dl.google.com/linux/chrome/rpm/stable/x86_64 google-chrome && \
    rpm --import https://dl.google.com/linux/linux_signing_key.pub && \
    zypper refresh && \
    zypper install -y google-chrome-stable && \
    zypper clean -a

# Verify xvfb-run is available
RUN which xvfb-run

# Create test user with sudo access
RUN groupadd testuser && \
    useradd -m -g testuser -s /bin/bash testuser && \
    echo 'testuser ALL=(ALL) NOPASSWD:ALL' >> /etc/sudoers

WORKDIR /app
USER testuser

# Default command
CMD ["bash"]
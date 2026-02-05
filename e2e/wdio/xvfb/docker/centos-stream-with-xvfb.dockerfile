FROM quay.io/centos/centos:stream10

# Set environment variables
ENV CI=true

# Enable CRB repository and install EPEL (required for Xvfb in CentOS Stream 10)
RUN dnf update -y && \
    dnf install -y \
        ca-certificates \
        sudo \
        which \
        dnf-plugins-core && \
    dnf config-manager --set-enabled crb && \
    dnf install -y epel-release && \
    dnf clean all

# Install requirements including xvfb (now available via EPEL)
RUN dnf install -y \
        xorg-x11-server-Xvfb \
        xorg-x11-server-utils && \
    dnf clean all

# Install Node.js from NodeSource
RUN curl -fsSL https://rpm.nodesource.com/setup_22.x | bash - && \
    dnf install -y nodejs

# Install pnpm globally as root
RUN npm install -g pnpm

# Install Chrome for testing
RUN echo '[google-chrome]' > /etc/yum.repos.d/google-chrome.repo && \
    echo 'name=google-chrome' >> /etc/yum.repos.d/google-chrome.repo && \
    echo 'baseurl=http://dl.google.com/linux/chrome/rpm/stable/x86_64' >> /etc/yum.repos.d/google-chrome.repo && \
    echo 'enabled=1' >> /etc/yum.repos.d/google-chrome.repo && \
    echo 'gpgcheck=1' >> /etc/yum.repos.d/google-chrome.repo && \
    echo 'gpgkey=https://dl.google.com/linux/linux_signing_key.pub' >> /etc/yum.repos.d/google-chrome.repo && \
    dnf install -y google-chrome-stable && \
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

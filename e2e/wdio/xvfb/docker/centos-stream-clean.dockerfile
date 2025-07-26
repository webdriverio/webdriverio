FROM quay.io/centos/centos:stream9

# Set environment variables
ENV CI=true

# Install basic requirements but explicitly NOT xvfb
RUN dnf update -y && \
    dnf install -y \
        ca-certificates \
        sudo \
        which && \
    dnf clean all

# Install Node.js 18 from NodeSource
RUN curl -fsSL https://rpm.nodesource.com/setup_18.x | bash - && \
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

# Ensure clean environment by removing any xvfb packages
RUN dnf remove -y xorg-x11-server-Xvfb xvfb-run || true && \
    dnf autoremove -y && \
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
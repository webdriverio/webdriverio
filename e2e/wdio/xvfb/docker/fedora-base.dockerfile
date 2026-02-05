FROM fedora:43

# Set environment variables
ENV CI=true

# Install basic requirements but explicitly NOT xvfb
RUN dnf update -y && \
    dnf install -y \
        curl \
        ca-certificates \
        sudo \
        nodejs \
        npm \
        which && \
    dnf clean all

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

# Create test user with sudo access
RUN useradd -m -s /bin/bash testuser && \
    echo 'testuser ALL=(ALL) NOPASSWD:ALL' >> /etc/sudoers

# Ensure clean environment by removing any xvfb packages (do this at the very end)
RUN dnf remove -y xorg-x11-server-Xvfb || true && \
    dnf autoremove -y && \
    rm -f /usr/bin/xvfb-run /usr/local/bin/xvfb-run && \
    dnf clean all

# Verify xvfb-run is NOT available
RUN ! which xvfb-run || exit 1

WORKDIR /app
USER testuser

# Default command
CMD ["bash"]

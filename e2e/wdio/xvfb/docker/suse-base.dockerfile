FROM opensuse/leap:15.6

# Set environment variables
ENV CI=true

# Install basic requirements but explicitly NOT xvfb
RUN zypper refresh && \
    zypper install -y \
        curl \
        ca-certificates \
        sudo \
        nodejs \
        npm && \
    zypper clean -a

# Install pnpm globally as root
RUN npm install -g pnpm

# Install Chrome for testing
RUN zypper addrepo -f http://dl.google.com/linux/chrome/rpm/stable/x86_64 google-chrome && \
    rpm --import https://dl.google.com/linux/linux_signing_key.pub && \
    zypper refresh && \
    zypper install -y google-chrome-stable && \
    zypper clean -a

# Create test user with sudo access
RUN groupadd testuser && \
    useradd -m -g testuser -s /bin/bash testuser && \
    echo 'testuser ALL=(ALL) NOPASSWD:ALL' >> /etc/sudoers

# Ensure clean environment by removing any xvfb packages (do this at the very end)
RUN zypper remove -y xorg-x11-server-Xvfb xvfb-run xorg-x11-apps xorg-x11 || true && \
    rm -f /usr/bin/xvfb-run /usr/local/bin/xvfb-run && \
    zypper clean -a

# Verify xvfb-run is NOT available
RUN ! which xvfb-run || exit 1

WORKDIR /app
USER testuser

# Default command
CMD ["bash"]

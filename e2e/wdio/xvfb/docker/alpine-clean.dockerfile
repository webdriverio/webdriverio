FROM alpine:3.20

# Set environment variables
ENV CI=true

# Add latest repositories
RUN echo @latest https://dl-cdn.alpinelinux.org/alpine/latest-stable/main >> /etc/apk/repositories && \
    echo @latest https://dl-cdn.alpinelinux.org/alpine/latest-stable/community >> /etc/apk/repositories

# Update apk index
RUN apk update

# Install basic requirements but explicitly NOT xvfb
RUN apk add --no-cache \
        curl \
        ca-certificates \
        sudo \
        nodejs-current \
        npm \
        bash \
        which \
        unzip \
        libc6-compat \
        libstdc++

# Install pnpm globally as root
RUN npm install -g pnpm

# Install Chrome for testing
RUN apk add --no-cache chromium@latest

# Set Chrome binary path for Alpine (uses chromium)
ENV CHROME_BIN=/usr/bin/chromium

# Create test user with sudo access
RUN adduser -D -s /bin/bash testuser && \
    echo 'testuser ALL=(ALL) NOPASSWD:ALL' >> /etc/sudoers

# Ensure clean environment by removing any xvfb packages (do this at the very end)
RUN apk del xvfb xvfb-run xorg-server || true && \
    rm -f /usr/bin/xvfb-run /usr/local/bin/xvfb-run

# Verify xvfb-run is NOT available
RUN ! which xvfb-run || exit 1

WORKDIR /app
USER testuser

# Default command
CMD ["bash"]

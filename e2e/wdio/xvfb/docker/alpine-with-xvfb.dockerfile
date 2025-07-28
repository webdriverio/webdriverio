FROM alpine:3.20

# Set environment variables
ENV CI=true

# Add latest repositories
RUN echo @latest https://dl-cdn.alpinelinux.org/alpine/latest-stable/main >> /etc/apk/repositories && \
    echo @latest https://dl-cdn.alpinelinux.org/alpine/latest-stable/community >> /etc/apk/repositories

# Update apk index
RUN apk update

# Install requirements including xvfb
RUN apk add --no-cache \
        curl \
        ca-certificates \
        sudo \
        nodejs \
        npm \
        bash \
        which \
        xvfb \
        xvfb-run \
        unzip \
        libc6-compat \
        libstdc++

# Install pnpm globally as root
RUN npm install -g pnpm

# Install Chromium for testing
RUN apk add --no-cache chromium@latest

# Set Chrome binary path for Alpine (uses chromium)
ENV CHROME_BIN=/usr/bin/chromium

# Verify xvfb-run is available
RUN which xvfb-run

# Create test user with sudo access
RUN adduser -D -s /bin/bash testuser && \
    echo 'testuser ALL=(ALL) NOPASSWD:ALL' >> /etc/sudoers

WORKDIR /app
USER testuser

# Default command
CMD ["bash"]

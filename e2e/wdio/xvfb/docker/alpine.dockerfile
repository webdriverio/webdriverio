FROM alpine:3.20

# Set environment variables
ENV CI=true

# Install basic requirements including Xvfb (Alpine uses Xvfb, limited Wayland support)
RUN apk update && \
    apk add --no-cache \
        curl \
        ca-certificates \
        sudo \
        nodejs \
        npm \
        chromium \
        xvfb-run && \
    rm -rf /var/cache/apk/*

# Install pnpm globally as root
RUN npm install -g pnpm

# Create test user with sudo access
RUN adduser -D -s /bin/sh testuser && \
    echo 'testuser ALL=(ALL) NOPASSWD:ALL' >> /etc/sudoers

WORKDIR /app
USER testuser

# Default command
CMD ["sh"]

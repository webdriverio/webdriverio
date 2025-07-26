FROM alpine:3.20

# Set environment variables
ENV CI=true

# Install requirements including xvfb
RUN apk add --no-cache \
        curl \
        ca-certificates \
        sudo \
        nodejs \
        npm \
        bash \
        xvfb

# Install pnpm globally as root
RUN npm install -g pnpm

# Verify xvfb-run is available
RUN which xvfb-run

# Create test user with sudo access
RUN adduser -D -s /bin/bash testuser && \
    echo 'testuser ALL=(ALL) NOPASSWD:ALL' >> /etc/sudoers

WORKDIR /app
USER testuser

# Default command
CMD ["bash"]
FROM alpine:3.18

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

# Verify xvfb-run is available
RUN which xvfb-run

# Create test user with sudo access
RUN adduser -D -s /bin/bash testuser && \
    echo 'testuser ALL=(ALL) NOPASSWD:ALL' >> /etc/sudoers

WORKDIR /app
USER testuser

# Default command
CMD ["bash"]
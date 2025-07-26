FROM alpine:3.20

# Set environment variables
ENV CI=true

# Install basic requirements but explicitly NOT xvfb
RUN apk add --no-cache \
        curl \
        ca-certificates \
        sudo \
        nodejs \
        npm \
        bash \
        which

# Install pnpm globally as root
RUN npm install -g pnpm

# Install Chrome for testing
RUN apk add --no-cache chromium

# Set Chrome binary path for Alpine (uses chromium)
ENV CHROME_BIN=/usr/bin/chromium-browser

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
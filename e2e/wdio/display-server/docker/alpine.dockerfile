FROM alpine:3.22

# Set environment variables
ENV CI=true
# Alpine ships chromium and a matching musl-built chromedriver. Point the
# wdio config at both so it skips the chrome-for-testing download
# (chrome-for-testing chromedriver is glibc-only and fails to spawn here
# with ENOENT because the glibc dynamic linker is absent on musl).
ENV CHROME_BIN=/usr/bin/chromium-browser
ENV CHROMEDRIVER_PATH=/usr/bin/chromedriver

# Install basic requirements including Xvfb (Alpine uses Xvfb, limited Wayland support)
RUN apk update && \
    apk add --no-cache \
        bash \
        curl \
        ca-certificates \
        sudo \
        nodejs \
        npm \
        chromium \
        chromium-chromedriver \
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

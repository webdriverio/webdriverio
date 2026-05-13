FROM alpine:3.20

# Set environment variables
ENV CI=true
# Alpine ships chromium and a matching musl-built chromedriver. Point the
# wdio config at both so it skips the chrome-for-testing download
# (chrome-for-testing chromedriver is glibc-only and fails to spawn here
# with ENOENT because the glibc dynamic linker is absent on musl).
ENV CHROME_BIN=/usr/bin/chromium-browser
ENV CHROMEDRIVER_PATH=/usr/bin/chromedriver
# Alpine ships chromium 131. Chromium 131's --headless=new mode is unreliable
# on minimal Alpine + musl (chromedriver hangs on Page.enable / Runtime.enable
# after spawning the renderer, tripping WDIO's 120s connectionRetryTimeout
# with UND_ERR_HEADERS_TIMEOUT). Legacy headless mode uses a simpler
# architecture and is stable here. Ubuntu/Arch/Void run newer chromium/chrome
# where --headless=new is fine, so opt this in per-distro.
ENV WDIO_LEGACY_HEADLESS=1

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

FROM ghcr.io/void-linux/void-glibc:latest

# Set environment variables
ENV CI=true
# Void's chromium package ships /usr/bin/chromedriver (symlink into
# /usr/lib/chromium/) — use it instead of letting wdio download
# chrome-for-testing chromedriver, which is built for a different chromium
# version and may not match the system browser.
ENV CHROME_BIN=/usr/bin/chromium
ENV CHROMEDRIVER_PATH=/usr/bin/chromedriver

# Refresh xbps itself first (Void's recommended bootstrap step). Then install
# packages.
#
# Notes:
# - ca-certificates is preinstalled in the base image; including it makes xbps
#   return a non-zero exit code on "already installed" which fails the build.
# - npm ships inside the `nodejs` package on Void — it is NOT a separate
#   package and xbps will error with "not found in repository pool".
RUN xbps-install -Suy xbps && \
    xbps-install -Sy \
        bash \
        curl \
        shadow \
        sudo \
        which \
        nodejs \
        weston \
        chromium && \
    xbps-install -Scc

# Install pnpm globally as root
RUN npm install -g pnpm

# Create test user with sudo access
RUN useradd -m -s /bin/bash testuser && \
    echo 'testuser ALL=(ALL) NOPASSWD:ALL' >> /etc/sudoers

WORKDIR /app
USER testuser

# Default command
CMD ["bash"]

FROM ghcr.io/void-linux/void-glibc:latest

# Set environment variables
ENV CI=true
ENV CHROME_BIN=/usr/bin/chromium

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

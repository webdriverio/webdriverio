FROM opensuse/leap:15.6

# Set environment variables
ENV CI=true

# Install requirements including xvfb
RUN zypper refresh && \
    zypper install -y \
        curl \
        ca-certificates \
        sudo \
        nodejs \
        npm \
        xorg-x11-server-Xvfb \
        xorg-x11-apps && \
    zypper clean -a

# Install pnpm globally as root
RUN npm install -g pnpm

# Install Chrome for testing
RUN zypper addrepo -f http://dl.google.com/linux/chrome/rpm/stable/x86_64 google-chrome && \
    rpm --import https://dl.google.com/linux/linux_signing_key.pub && \
    zypper refresh && \
    zypper install -y google-chrome-stable && \
    zypper clean -a

# Create xvfb-run script (SUSE doesn't package it)
RUN cat > /usr/bin/xvfb-run << 'EOF'
#!/bin/bash
# Simple xvfb-run implementation for SUSE
DISPLAY_NUM=99
XVFB_ARGS="-screen 0 1024x768x24"

while [[ $# -gt 0 ]]; do
    case $1 in
        --help)
            echo "Usage: xvfb-run [options] command [args...]"
            echo "Options:"
            echo "  --help        Show this help"
            echo "  -a            Auto-select display number"
            echo "  -s ARG        Xvfb screen argument"
            exit 0
            ;;
        -a)
            # Auto-select display number - just use 99 for simplicity
            shift
            ;;
        -s)
            XVFB_ARGS="$2"
            shift 2
            ;;
        --)
            shift
            break
            ;;
        *)
            break
            ;;
    esac
done

# Start Xvfb in background
Xvfb :$DISPLAY_NUM $XVFB_ARGS >/dev/null 2>&1 &
XVFB_PID=$!

# Set DISPLAY environment variable
export DISPLAY=:$DISPLAY_NUM

# Run the command
"$@"
RESULT=$?

# Clean up
kill $XVFB_PID 2>/dev/null || true
wait $XVFB_PID 2>/dev/null || true

exit $RESULT
EOF

chmod +x /usr/bin/xvfb-run

# Verify xvfb-run is available
RUN which xvfb-run

# Create test user with sudo access
RUN groupadd testuser && \
    useradd -m -g testuser -s /bin/bash testuser && \
    echo 'testuser ALL=(ALL) NOPASSWD:ALL' >> /etc/sudoers

WORKDIR /app
USER testuser

# Default command
CMD ["bash"]
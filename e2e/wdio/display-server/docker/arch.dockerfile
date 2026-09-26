FROM archlinux:latest

ENV CI=true
# google-chrome lives in the AUR; use chromium from the official extra repo
# instead. The wdio config honors CHROME_BIN to pick this up.
# Arch's chromium package ships /usr/bin/chromedriver alongside the browser.
ENV CHROME_BIN=/usr/bin/chromium
ENV CHROMEDRIVER_PATH=/usr/bin/chromedriver

# Pin to Node 22 LTS. Arch's `nodejs` package follows current (Node 24+),
# whose tightened undici input validation makes WDIO's session POST fail
# with UND_ERR_INVALID_ARG. The rest of the matrix runs Node 20/22 and
# passes, so align Arch with that range.
RUN pacman -Syu --noconfirm \
        curl \
        ca-certificates \
        sudo \
        nodejs-lts-jod \
        npm \
        weston \
        chromium && \
    pacman -Scc --noconfirm

RUN npm install -g pnpm@11.27.1

RUN useradd -m -s /bin/bash testuser && \
    echo 'testuser ALL=(ALL) NOPASSWD:ALL' >> /etc/sudoers

WORKDIR /app
USER testuser

CMD ["bash"]

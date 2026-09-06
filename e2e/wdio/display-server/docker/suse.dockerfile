FROM opensuse/leap:16.0

ENV CI=true

RUN zypper refresh && \
    zypper install -y \
        curl \
        ca-certificates \
        sudo \
        nodejs \
        npm \
        weston && \
    zypper clean -a

RUN npm install -g pnpm

# Install Chrome for testing
RUN zypper addrepo -f http://dl.google.com/linux/chrome/rpm/stable/x86_64 google-chrome && \
    rpm --import https://dl.google.com/linux/linux_signing_key.pub && \
    zypper refresh && \
    zypper install -y google-chrome-stable && \
    zypper clean -a

RUN groupadd testuser && \
    useradd -m -g testuser -s /bin/bash testuser && \
    echo 'testuser ALL=(ALL) NOPASSWD:ALL' >> /etc/sudoers

WORKDIR /app
USER testuser

CMD ["bash"]

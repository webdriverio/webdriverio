FROM fedora:43

ENV CI=true

RUN dnf update -y && \
    dnf install -y \
        curl \
        ca-certificates \
        sudo \
        nodejs \
        npm \
        which \
        weston && \
    dnf clean all

RUN npm install -g pnpm

# Install Chrome for testing
RUN echo '[google-chrome]' > /etc/yum.repos.d/google-chrome.repo && \
    echo 'name=google-chrome' >> /etc/yum.repos.d/google-chrome.repo && \
    echo 'baseurl=http://dl.google.com/linux/chrome/rpm/stable/x86_64' >> /etc/yum.repos.d/google-chrome.repo && \
    echo 'enabled=1' >> /etc/yum.repos.d/google-chrome.repo && \
    echo 'gpgcheck=1' >> /etc/yum.repos.d/google-chrome.repo && \
    echo 'gpgkey=https://dl.google.com/linux/linux_signing_key.pub' >> /etc/yum.repos.d/google-chrome.repo && \
    dnf install -y google-chrome-stable && \
    dnf clean all

RUN useradd -m -s /bin/bash testuser && \
    echo 'testuser ALL=(ALL) NOPASSWD:ALL' >> /etc/sudoers

WORKDIR /app
USER testuser

CMD ["bash"]

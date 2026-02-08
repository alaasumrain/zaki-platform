FROM docker.io/cloudflare/sandbox:0.7.0

# Install Node.js 22 (required by clawdbot/OpenClaw)
# Clean up aggressively to reduce image size
ENV NODE_VERSION=22.13.1
RUN ARCH="$(dpkg --print-architecture)" \
    && case "${ARCH}" in \
         amd64) NODE_ARCH="x64" ;; \
         arm64) NODE_ARCH="arm64" ;; \
         *) echo "Unsupported architecture: ${ARCH}" >&2; exit 1 ;; \
       esac \
    && apt-get update && apt-get install -y --no-install-recommends xz-utils ca-certificates rsync \
    && curl -fsSLk https://nodejs.org/dist/v${NODE_VERSION}/node-v${NODE_VERSION}-linux-${NODE_ARCH}.tar.xz -o /tmp/node.tar.xz \
    && tar -xJf /tmp/node.tar.xz -C /usr/local --strip-components=1 \
    && rm /tmp/node.tar.xz \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/* \
    && node --version \
    && npm --version

# Install OpenClaw (CLI is still named clawdbot until upstream renames)
# Clean npm cache to reduce size
RUN npm install -g clawdbot@2026.1.24-3 --omit=dev \
    && npm cache clean --force \
    && rm -rf /root/.npm /tmp/* \
    && clawdbot --version

# Create OpenClaw directories
RUN mkdir -p /root/.clawdbot \
    && mkdir -p /root/.clawdbot-templates \
    && mkdir -p /root/clawd \
    && mkdir -p /root/clawd/skills \
    && mkdir -p /data/zaki

# Copy startup script (bust cache: v2)
COPY start-zaki.sh /usr/local/bin/start-zaki.sh
RUN chmod +x /usr/local/bin/start-zaki.sh && echo "v2"

# Set working directory
WORKDIR /root/clawd

# Expose the gateway port
EXPOSE 18789

# v2

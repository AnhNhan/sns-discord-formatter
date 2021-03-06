FROM node:10-alpine

# Installs latest Chromium (72) package.
RUN apk update && apk upgrade && \
    echo @edge http://nl.alpinelinux.org/alpine/edge/community >> /etc/apk/repositories && \
    echo @edge http://nl.alpinelinux.org/alpine/edge/main >> /etc/apk/repositories && \
    apk add --no-cache \
      chromium@edge \
      nss@edge \
      freetype@edge \
      harfbuzz@edge \
      ttf-freefont@edge \
      mesa-gl mesa-gles \
      && rm -rf /var/cache/* \
      && mkdir /var/cache/apk

# Tell Puppeteer to skip installing Chrome. We'll be using the installed package.
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    CHROME_BIN=/usr/bin/chromium-browser \
    CHROME_PATH=/usr/lib/chromium/

# Add user so we don't need --no-sandbox.
RUN addgroup -S pptruser && adduser -S -g pptruser pptruser \
    && mkdir -p /home/pptruser/Downloads \
    && chown -R pptruser:pptruser /home/pptruser \
    && mkdir -p /app \
    && chown -R pptruser:pptruser /app

# Run everything after as non-privileged user.
USER pptruser

WORKDIR /app

COPY --chown=pptruser:pptruser package*.json ./

RUN npm version

RUN npm version && npm install

# compatible with chrome 73
RUN npm install --save puppeteer@1.12.2

COPY --chown=pptruser:pptruser . .

RUN npx ng version && npx ng build

EXPOSE 4200

# todo setup a proper webserver
CMD [ "npx", "ng", "serve", "--host", "0.0.0.0", "--disable-host-check" ]

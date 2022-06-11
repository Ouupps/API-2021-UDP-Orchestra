FROM node:16

COPY src /srv/src
WORKDIR /srv/src

RUN npm install
ENTRYPOINT ["node", "/srv/src/musician.js"]

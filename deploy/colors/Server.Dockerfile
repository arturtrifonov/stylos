FROM node:24-alpine
WORKDIR /app
COPY server/server.mjs /app/server.mjs
COPY site/stylos.json /app/stylos.json
USER node
CMD ["node", "server.mjs"]

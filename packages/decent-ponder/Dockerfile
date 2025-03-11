FROM oven/bun:latest

WORKDIR /usr/src/app

FROM oven/bun:latest AS install

COPY package.json ./

RUN bun install --frozen-lockfile

COPY . .

EXPOSE 42069

CMD ["bun", "start"]

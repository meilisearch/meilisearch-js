FROM node:22-slim

ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
ENV HUSKY=0

WORKDIR /home/package

COPY package.json ./
RUN corepack enable && corepack install

CMD ["bash"]

FROM node:22-slim

ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
ENV HUSKY=0

RUN corepack enable && corepack prepare pnpm@10.32.1 --activate

WORKDIR /home/package

CMD ["bash"]

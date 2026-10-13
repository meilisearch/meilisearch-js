# Cloud Agent

Node.js 22.22, pnpm, and Meilisearch Enterprise 1.54 are installed. Startup runs Meilisearch at `http://127.0.0.1:7700` with master key `masterKey`.

## Checks

1. `node -v` reports 22.22. That build is `~/.nvm`, linked at `/usr/local/cargo/bin/node`. `pnpm lint` loads `oxlint.config.ts` on it.
2. `HUSKY=0 pnpm install --frozen-lockfile`. `HUSKY=0` skips the Husky `prepare` git hooks.
3. `curl -sf http://127.0.0.1:7700/health`. Done when it exits 0. If it fails, start Meilisearch, then re-check.
4. `pnpm test`
5. `pnpm style && pnpm types && pnpm build`

## Start Meilisearch

```bash
mkdir -p "$HOME/.local/share/meilisearch/dumps" "$HOME/.local/share/meilisearch/snapshots"
meilisearch --master-key=masterKey --no-analytics \
  --db-path "$HOME/.local/share/meilisearch" \
  --dump-dir "$HOME/.local/share/meilisearch/dumps" \
  --snapshot-dir "$HOME/.local/share/meilisearch/snapshots" \
  --http-addr 127.0.0.1:7700 \
  --experimental-allowed-ip-networks any \
  --env development
```

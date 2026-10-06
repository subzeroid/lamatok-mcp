# lamatok-mcp

[![npm version](https://img.shields.io/npm/v/lamatok-mcp.svg)](https://www.npmjs.com/package/lamatok-mcp)
[![npm downloads](https://img.shields.io/npm/dm/lamatok-mcp.svg)](https://www.npmjs.com/package/lamatok-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

MCP server for [LamaTok](https://lamatok.com) — TikTok data API. Available on npm: [`lamatok-mcp`](https://www.npmjs.com/package/lamatok-mcp).

Generates MCP tools from the LamaTok OpenAPI spec at startup. Tools map 1:1 to REST endpoints (`GET /v1/user/by/username` → `get_v1_user_by_username`). By default you get a **core set of ~23 tools**, one per task, each with a description that tells the assistant when to use it; `LAMATOK_TOOLS=all` exposes every non-deprecated endpoint.

## Get 100 Free API Requests

**[Sign up with this link](https://lamatok.com/p/s6kl8mtn)** and get **100 free LamaTok requests** — no credit card required. Enough to wire up the MCP server, try a few prompts in Claude/Cursor/Codex, and evaluate the data quality before committing.

> **[Get your free 100 requests here](https://lamatok.com/p/s6kl8mtn)**

## Quick start

1. Get an API key at [lamatok.com](https://lamatok.com).
2. Add the server to your AI assistant.
3. Ask your assistant something like:
   - *"Get the TikTok profile for @nasa."*
   - *"List the last 10 videos by user_id 6707206320333226502."*
   - *"Find recent TikTok videos for the hashtag `photography`."*

### Claude Code

```bash
claude mcp add lamatok -e LAMATOK_KEY=your-api-key -- npx -y lamatok-mcp
```

### Claude Desktop

Add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "lamatok": {
      "command": "npx",
      "args": ["-y", "lamatok-mcp"],
      "env": {
        "LAMATOK_KEY": "your-api-key"
      }
    }
  }
}
```

### Cursor / Windsurf

Same shape as Claude Desktop — put the block under `mcpServers` in the app's MCP config file.

### Zed

Add to `~/.config/zed/settings.json`:

```json
{
  "context_servers": {
    "lamatok": {
      "command": "npx",
      "args": ["-y", "lamatok-mcp"],
      "env": {
        "LAMATOK_KEY": "your-api-key"
      }
    }
  }
}
```

### OpenAI Codex

Append to `~/.codex/config.toml`:

```toml
[mcp_servers.lamatok]
command = "npx"
args = ["-y", "lamatok-mcp"]

[mcp_servers.lamatok.env]
LAMATOK_KEY = "your-api-key"
```

## Tools

Tools are generated at startup from the live [LamaTok OpenAPI spec](https://api.lamatok.com/openapi.json). The default **core set** keeps one endpoint per task and drops version duplicates:

| Group                 | Tools | Examples                                                                          |
| --------------------- | ----- | --------------------------------------------------------------------------------- |
| Profiles and audience | 12    | `get_v1_user_by_username`, `get_v2_user_medias_by_secUid`, `get_v1_user_followers_by_username` |
| Videos and comments   | 4     | `get_v1_media_by_url`, `get_v1_media_by_id`, `get_v1_media_comments_by_id`        |
| Download links        | 4     | `get_v1_media_video_download_by_url`, `get_v1_media_music_download_by_id`         |
| Hashtags and search   | 3     | `get_v1_hashtag_info`, `get_v1_hashtag_medias`, `get_v2_search`                   |

Core tools carry hand-written descriptions (what the tool does, when to prefer a sibling, pagination, billing) and every tool is annotated read-only. The list lives in [`src/curated.ts`](src/curated.ts).

Set `LAMATOK_TOOLS=all` to expose every non-deprecated endpoint instead — same tool names as before, so existing prompts keep working. Tool names mirror their endpoint (`GET /v1/user/by/username` → `get_v1_user_by_username`); call `tools/list` over MCP for the current list with parameter schemas. `/sys`, `Legacy`, and `System` tag groups are excluded in both modes.

## Configuration

| Variable                     | Description                                                                    | Required |
| ---------------------------- | ------------------------------------------------------------------------------ | -------- |
| `LAMATOK_KEY`                | Your LamaTok access key (sent as `x-access-key` header)                        | yes      |
| `LAMATOK_URL`                | Base URL. Default: `https://api.lamatok.com`                                   | no       |
| `LAMATOK_SPEC_URL`           | OpenAPI spec URL. Default: `${LAMATOK_URL}/openapi.json`                       | no       |
| `LAMATOK_TOOLS`              | `core` (default): curated set, one tool per task. `all`: every non-deprecated endpoint | no |
| `LAMATOK_TAGS`               | Whitelist: only include operations with these tags (comma-separated)           | no       |
| `LAMATOK_EXCLUDE_TAGS`       | Blacklist: additional tags to exclude (on top of `Legacy`, `System`, `/sys`)   | no       |
| `LAMATOK_TIMEOUT_MS`         | Per-request timeout for API calls. Default: `30000`                            | no       |
| `LAMATOK_SPEC_TIMEOUT_MS`    | Timeout for the startup spec fetch. Default: `60000`                           | no       |
| `LAMATOK_SPEC_RETRY_DELAY_MS` | Base delay between the 3 startup spec fetch attempts. Default: `2000`        | no       |
| `LAMATOK_MAX_RESPONSE_BYTES` | Max bytes read from each API response. Default: `10485760` (10 MB)             | no       |
| `LAMATOK_MAX_SPEC_BYTES`     | Max bytes read from the OpenAPI spec. Default: `8388608` (8 MB)                | no       |

`Legacy`, `System`, and `/sys` tags are excluded by default. Deprecated operations are also skipped.

If `LAMATOK_URL` points to a host other than `api.lamatok.com`, the server prints a warning on startup — your key will be sent there, so only use it for a self-hosted or proxied LamaTok.

Requests are sent with `User-Agent: lamatok-mcp/<version>`.

## How it works

```
AI Assistant ←stdio→ lamatok-mcp ──https──> api.lamatok.com
                          │
                          └─ fetches /openapi.json once on startup,
                             builds one MCP tool per GET endpoint
                             (core set by default)
```

Tool arguments map to the endpoint's `query` and `path` parameters. The response body is returned as-is (JSON text). Non-2xx responses are surfaced as tool errors with the HTTP status and body.

## Development

```bash
git clone https://github.com/subzeroid/lamatok-mcp.git
cd lamatok-mcp
npm install
npm run build
LAMATOK_KEY=your-key node dist/index.js
```

Run in watch mode:

```bash
LAMATOK_KEY=your-key npm run dev
```

Run tests (unit + stdio smoke tests against a local mock server, no network/API key required):

```bash
npm test
```

## License

MIT

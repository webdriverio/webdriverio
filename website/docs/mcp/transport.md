---
id: transport
title: Transport
---

The WebdriverIO MCP server supports two transport modes: **stdio** (default) and **HTTP**.

## stdio (default)

stdio is the standard MCP transport. The AI client launches the server as a child process and communicates over stdin/stdout.

```json
{
  "mcpServers": {
    "webdriverio": {
      "command": "npx",
      "args": ["-y", "@wdio/mcp"]
    }
  }
}
```

Use stdio for local setups with Claude Desktop, Claude Code, Cursor, and similar clients that manage the server lifecycle themselves.

---

## HTTP (Streamable HTTP)

HTTP mode runs the server as a standalone process that listens on a port. Clients connect to it over HTTP rather than launching it as a subprocess. Use this when:

- Your client doesn't support subprocess-based MCP (e.g. llama.cpp's web UI)
- You want to share one server instance across multiple clients
- You're running in Codex secure mode where subprocess execution is restricted
- You want to keep the server running across multiple client sessions

### Starting in HTTP mode

```bash
npx @wdio/mcp --http --port 3000
```

The server exposes a single endpoint: `http://localhost:<port>/mcp`

### Full options

```bash
npx @wdio/mcp --http \
  --port 3000 \
  --allowedHosts "localhost,127.0.0.1,::1" \
  --allowedOrigins "http://localhost:5173,https://myapp.example.com"
```

| Flag | Default | Description |
|------|---------|-------------|
| `--http` | — | Enable HTTP transport mode |
| `--port` | `3000` | Port to listen on |
| `--allowedHosts` | `localhost,127.0.0.1,::1` | Comma-separated allowed `Host` header values (DNS rebinding protection) |
| `--allowedOrigins` | _(none — browsers blocked)_ | Comma-separated allowed `Origin` values for CORS. Use `*` to allow all origins. |

### Security

**`--allowedHosts`** — Protects against DNS rebinding attacks. Only requests with a `Host` header matching this list are accepted. The default (`localhost,127.0.0.1,::1`) is safe for local use. If you expose the server on a public interface, add your hostname here.

**`--allowedOrigins`** — Controls which browser origins can make cross-origin requests (CORS). By default, no browser origins are allowed. This blocks access from arbitrary websites while still allowing non-browser clients (CLI tools, API clients). Set to `*` to allow all origins, or list specific origins.

Requests from non-browser clients (no `Origin` header) are not subject to the CORS check — only `--allowedHosts` applies.

---

## Use Cases

### llama.cpp web UI

llama.cpp's web UI runs in the browser and sends an `Origin` header on every request. Start the server with `--allowedOrigins` matching the UI's origin:

```bash
# llama.cpp web UI runs at http://localhost:8080
npx @wdio/mcp --http --port 3000 --allowedOrigins "http://localhost:8080"

# Or allow all local origins
npx @wdio/mcp --http --port 3000 --allowedOrigins "*"
```

In llama.cpp's settings, add an MCP server pointing to `http://localhost:3000/mcp`.

---

### Codex secure mode

OpenAI Codex runs in a sandboxed environment without subprocess support. Use HTTP transport so Codex can reach the MCP server running on your host machine:

```bash
# Start on your host
npx @wdio/mcp --http --port 3000
```

In your Codex MCP configuration, set the server URL to `http://localhost:3000/mcp` (or your host's IP if Codex runs in a VM).

---

### Per-request architecture

Each HTTP request creates a fresh MCP server instance. This means:

- Clients can reconnect after dropping a connection without errors.
- Multiple clients can connect simultaneously (each gets an independent MCP session).
- Session state (the active browser/app) is shared via global state, not transport state.

There is no mutex — requests are handled concurrently. MCP protocol statefulness (initialize → tool calls) is handled per-request.

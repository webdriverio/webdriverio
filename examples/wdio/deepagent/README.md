# DeepAgent example

Reference setup generated with the harness's own `wdio-deepagent init`
wizard (mocha + TypeScript, `deepagent` block with an OpenRouter model).

## What's here

- `wdio.conf.ts` — testrunner config including the `deepagent` block
  consumed by the harness
- `deepagent.test.ts` — a plain spec the agent can browse to and assert
  on (traversal goes through `@wdio/mcp`)

## Run the spec

```sh
pnpm test:deepagent
```

## Agent sessions

Secrets only via env vars:

```sh
export OPENROUTER_API_KEY=...
pnpm wdio-deepagent repl               # interactive agent session
pnpm wdio-deepagent run "load the example page and check the title"
```

`repl` / `run` work with just the `deepagent` block above.

## Trace diagnosis (optional)

`wdio-deepagent diagnose` reproduces and heals failing specs from
`@wdio/devtools-service` trace artifacts. For that you need the service
in your project:

```sh
npm i -D @wdio/devtools-service
# in wdio.conf.ts: services: ['devtools']
```

Then a failing run produces `trace-*.zip` artifacts, e.g.:

```sh
pnpm wdio-deepagent diagnose test-results/trace-*.zip --spec ./deepagent.test.ts
```

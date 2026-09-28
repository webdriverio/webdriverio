# WebDriver Bidi Codegen

Internal package that downloads the latest [WebDriver Bidi](https://w3c.github.io/webdriver-bidi/) CDDL artifact from the [w3c/webdriver-bidi](https://github.com/w3c/webdriver-bidi) repository and generates:

- TypeScript types in `packages/webdriver/src/bidi/{local,remote}Types.ts`
- the `BidiHandler` class in `packages/webdriver/src/bidi/handler.ts`
- protocol command metadata in `packages/wdio-protocols/src/protocols/webdriverBidi.ts`

This package is not published to NPM.

## Workflow

Called from the repo root as part of `pnpm run generate` (and therefore `pnpm run build`) and again before `pnpm run docs:generate`:

```sh
pnpm run generate:bidi
# equivalent:
pnpm -r --filter=@wdio/bidi-codegen run generate
```

Requires a `GITHUB_AUTH` token so the script can list and download GitHub Actions artifacts. When the token is missing the generator exits without failing the build.

## Options

None. The generator always writes into the packages listed above.

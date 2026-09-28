# infra/

Internal workspace packages. Not published to npm.

| Package | Role |
|---------|------|
| [`compiler`](compiler/AGENTS.md) | Esbuild + protocol type generation |
| [`lernaPatch`](lernaPatch/README.md) | Lerna release install skip |
| [`repo-tools`](repo-tools/AGENTS.md) | Docs index, scoped tests, CI lane helpers |
| [`utils`](utils/README.md) | Protocol metadata and shared helpers (`@wdio/repo-utils`) |
| [`bidiCodegen`](bidiCodegen/README.md) | WebDriver BiDi type generation |
| [`docs`](docs/AGENTS.md) | Documentation website generation |
| [`release`](release/README.md) | Changelog, tags, and backports |
| [`createPackage`](createPackage/README.md) | Scaffold a new workspace package |
| [`depcheck`](depcheck/README.md) | Dependency checks |

New repo helpers belong in one of these packages, not as loose files under `/scripts`.

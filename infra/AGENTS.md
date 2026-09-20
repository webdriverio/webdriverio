# infra/

Internal workspace packages. Not published to npm.

| Package | Role |
|---------|------|
| [`compiler`](compiler/AGENTS.md) | Esbuild + protocol type generation |
| [`lernaPatch`](lernaPatch/README.md) | Lerna release install skip |
| [`repo-tools`](repo-tools/AGENTS.md) | Docs index, scoped tests, CI lane helpers |

New repo helpers belong in `repo-tools` as TypeScript modules, not as loose
files under `/scripts`.

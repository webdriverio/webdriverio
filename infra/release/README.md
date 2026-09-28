# Release Tools

Internal package used during WebdriverIO releases. It is not published to NPM.

It covers three maintainer workflows:

- **changelog** — generate a `CHANGELOG.md` section from merged PRs (via `lerna-changelog`) and create a GitHub release
- **push-tags** — push the annotated `vX.Y.Z` tag that Lerna created
- **backport** — cherry-pick PRs labeled `backport-requested` onto the maintenance LTS branch

## Workflow

Called from the repo root:

```sh
# after lerna versions packages (`pnpm version` hook)
pnpm run changelog
# equivalent:
pnpm -r --filter=@wdio/release run changelog

# after `lerna publish` (see .github/workflows/publish.yml)
pnpm run pushReleaseTag
# equivalent:
pnpm -r --filter=@wdio/release run push-tags

# as a triager on the maintenance branch
pnpm run backport
# equivalent:
pnpm -r --filter=@wdio/release run backport
```

`changelog` and `backport` require a `GITHUB_AUTH` token with `public_repo` scope. See [CONTRIBUTING.md](../../CONTRIBUTING.md#release-new-version).

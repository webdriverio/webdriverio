import fs from 'node:fs'
import url from 'node:url'
import path from 'node:path'

import { IGNORED_SUBPACKAGES_FOR_DOCS } from '../protocols.js'
import { getSubPackages } from '../utils/helpers.js'

import reporters3rdParty from './3rd-party/reporters.json' with { type: 'json' }
import services3rdParty from './3rd-party/services.json' with { type: 'json' }

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))
const PACKAGES_DIR = path.join(__dirname, '..', '..', 'packages')
const OUTPUT = path.join(__dirname, '..', '..', 'website', 'docs', '_ecosystem.md')

interface Entry {
    name: string
    packageName: string
    docId: string
    description?: string
    repoUrl: string
}

const escapeCell = (text = '') => text.replace(/\|/g, '\\|').replace(/\s+/g, ' ').trim()

function officialPlugins (type: 'service' | 'reporter'): Entry[] {
    return getSubPackages(IGNORED_SUBPACKAGES_FOR_DOCS)
        .filter((pkg) => pkg.endsWith(`-${type}`) && pkg.split('-').length > 2)
        .map((pkg) => {
            const name = pkg.split('-').slice(1, -1)
            const pkgJson = JSON.parse(fs.readFileSync(path.join(PACKAGES_DIR, pkg, 'package.json'), 'utf-8'))
            return {
                name: name.map((n) => n[0].toUpperCase() + n.slice(1)).join(' '),
                packageName: pkgJson.name,
                docId: `${name.join('-')}-${type}`,
                description: pkgJson.description,
                repoUrl: `https://github.com/webdriverio/webdriverio/tree/main/packages/${pkg}`
            }
        })
}

function communityPlugins (list: { packageName: string, title: string, githubUrl: string }[]): Entry[] {
    return list.map(({ packageName, title, githubUrl }) => ({
        name: title,
        packageName,
        docId: packageName.replace(/@/g, '').replace(/\//g, '-'),
        repoUrl: githubUrl
    }))
}

function table (entries: Entry[], withDescription: boolean) {
    const header = withDescription
        ? ['| Plugin | Package | Description |', '| --- | --- | --- |']
        : ['| Plugin | Package | Source |', '| --- | --- | --- |']
    const rows = entries
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((e) => withDescription
            ? `| [${escapeCell(e.name)}](/docs/${e.docId}) | \`${e.packageName}\` | ${escapeCell(e.description)} |`
            : `| [${escapeCell(e.name)}](/docs/${e.docId}) | \`${e.packageName}\` | [GitHub](${e.repoUrl}) |`)
    return [...header, ...rows].join('\n')
}

/**
 * Generates the Ecosystem landing page: a directory of every documented
 * service and reporter, built from the same metadata as the plugin pages.
 */
export function generateEcosystemDocs () {
    const officialServices = officialPlugins('service')
    const officialReporters = officialPlugins('reporter')
    const communityServices = communityPlugins(services3rdParty)
    const communityReporters = communityPlugins(reporters3rdParty)

    const doc = `---
id: ecosystem
title: Ecosystem
description: Directory of all official and community WebdriverIO services, reporters and tools, with the package to install for each.
---

WebdriverIO is extended through **services** (hook into the test lifecycle, e.g. start a driver, connect to a cloud or add commands) and **reporters** (format test results). Official plugins are maintained in the [WebdriverIO monorepo](https://github.com/webdriverio/webdriverio), community plugins by their authors. Install a plugin as a dev dependency and add it to the \`services\` or \`reporters\` array of your \`wdio.conf.ts\`:

\`\`\`ts title="wdio.conf.ts"
export const config: WebdriverIO.Config = {
    // ...
    services: ['appium'],
    reporters: ['spec', ['allure', { outputDir: 'allure-results' }]],
}
\`\`\`

The WebdriverIO configuration wizard (\`npm init wdio@latest\`) can install and configure most of the plugins below for you.

## Tools

| Tool | What it does |
| --- | --- |
| [WebdriverIO MCP](/docs/mcp) | Model Context Protocol server (\`@wdio/mcp\`) that lets AI agents drive browsers and mobile apps. |
| [WebdriverIO DevTools](/docs/devtools) | Live dashboard and trace viewer to debug WebdriverIO, Selenium and Nightwatch tests. |
| [Visual Testing](/docs/visual-testing) | Pixel-by-pixel visual regression testing (\`@wdio/visual-service\`). |
| [expect-webdriverio](/docs/api/expect-webdriverio) | The assertion library bundled with the testrunner. |
| [Boilerplate projects](/docs/boilerplates) | Starter projects for many stacks, maintained by the project and the community. |
| [Cloud services](/docs/cloudservices) | Run tests on BrowserStack, Sauce Labs, TestMu AI and other device clouds. |

## Official Services

${table(officialServices, true)}

## Community Services

${table(communityServices, false)}

## Official Reporters

${table(officialReporters, true)}

## Community Reporters

${table(communityReporters, false)}

## Add Your Plugin

Built a service or reporter? Add it to [\`scripts/docs-generation/3rd-party\`](https://github.com/webdriverio/webdriverio/tree/main/scripts/docs-generation/3rd-party) to have its README published on this site. See [Custom Services](/docs/customservices) and [Custom Reporter](/docs/customreporter) for how to build one.
`
    fs.writeFileSync(OUTPUT, doc, { encoding: 'utf-8' })
    console.log(`Generated ecosystem directory with ${officialServices.length + communityServices.length} services and ${officialReporters.length + communityReporters.length} reporters`)
}

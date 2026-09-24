#!/usr/bin/env node
import fs from 'node:fs'
import url from 'node:url'
import path from 'node:path'

import sidebars from '../../website/_sidebars.json' with { type: 'json' }
import { generateProtocolDocs } from './protocolDocs.js'
import { generateWdioDocs } from './wdioDocs.js'
import { generateReportersAndServicesDocs } from './packagesDocs.js'
import { generate3rdPartyDocs } from './3rdPartyDocs.js'
import { generateEcosystemDocs } from './ecosystemDocs.js'
import { generateElectronDocs } from './electronDocs.js'
import { generateTauriDocs } from './tauriDocs.js'
import { generateDioxusDocs } from './dioxusDocs.js'
import { generateEventDocs } from './eventDocs.js'
import { copyContributingDocs } from './copyContributingDocs.js'
import { downloadAwesomeResources } from './downloadAwesomeResources.js'

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))

function print (title: string) {
    console.log(`
//////////////////////////////////////////////////
${title}
//////////////////////////////////////////////////`)
}

/**
 * Local preview only serves the default locale. Pass `--en` (or
 * `DOCS_ENGLISH_ONLY=1`) to skip the webdriverio/i18n zip download.
 */
function englishOnly() {
    return process.argv.includes('--en') || process.env.DOCS_ENGLISH_ONLY === '1'
}

function writeSidebars(sidebars: unknown) {
    fs.writeFileSync(
        path.join(__dirname, '..', '..', 'website', 'sidebars.json'),
        JSON.stringify(sidebars, null, 2),
        { encoding: 'utf-8' }
    )
}

/**
 * NOTE: all generate docs functions mutate `sidebars` object!
 */
try {
    print('Generate Protocol Docs')
    generateProtocolDocs(sidebars)
    print('Generate WebdriverIO Docs')
    await generateWdioDocs(sidebars)
    print('Generate Reporter & Services Docs')
    generateReportersAndServicesDocs(sidebars)
    await generate3rdPartyDocs(sidebars)
    generateEcosystemDocs()
    print('Generate Event Docs')
    await generateEventDocs()
    print('Generate Desktop Service Docs (Electron + Tauri + Dioxus)')
    await generateElectronDocs()
    await generateTauriDocs()
    await generateDioxusDocs()
    print('Copy over Contributing Guidelines')
    await copyContributingDocs()
    print('Copy over Awesome Resources')
    await downloadAwesomeResources()
    if (englishOnly()) {
        print('English-only docs (skipping translation download)')
    } else {
        print('Download docs translations')
        const { downloadDocsTranslations } = await import('./downloadDocsTranslations.js')
        await downloadDocsTranslations()
    }

    writeSidebars(sidebars)

    console.log('=== Docs generated successfully! ===')
} catch (err) {
    console.error(err)
    process.exit(1)
}


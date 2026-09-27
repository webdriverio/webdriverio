import path from 'node:path'
import { getRootDir, toFileUrl } from '@wdio/repo-utils'

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
import { print, writeSidebars } from './output.js'

export { print, writeSidebars } from './output.js'

export interface GenerateDocsOptions {
    rootDir?: string
    sidebars?: unknown
    /**
     * Local preview only serves the default locale. Skip the webdriverio/i18n
     * zip download when this is set, or when `--en` / `DOCS_ENGLISH_ONLY=1`
     * is present.
     */
    englishOnly?: boolean
}

/**
 * Local preview only serves the default locale. Pass `--en` (or
 * `DOCS_ENGLISH_ONLY=1`) to skip the webdriverio/i18n zip download.
 */
export function englishOnly(argv = process.argv, env = process.env) {
    return argv.includes('--en') || env.DOCS_ENGLISH_ONLY === '1'
}

/**
 * NOTE: all generate docs functions mutate `sidebars` object!
 */
export async function generateDocs (options: GenerateDocsOptions = {}) {
    const rootDir = options.rootDir ?? getRootDir()
    const websiteDir = path.join(rootDir, 'website')
    const sidebars = options.sidebars ?? (
        await import(
            toFileUrl(path.join(websiteDir, '_sidebars.json')),
            { with: { type: 'json' } }
        )
    ).default
    const skipTranslations = options.englishOnly ?? englishOnly()

    print('Generate Protocol Docs')
    generateProtocolDocs(sidebars, { websiteDir })
    print('Generate WebdriverIO Docs')
    await generateWdioDocs(sidebars, { rootDir })
    print('Generate Reporter & Services Docs')
    generateReportersAndServicesDocs(sidebars, { rootDir })
    await generate3rdPartyDocs(sidebars, { rootDir })
    generateEcosystemDocs(rootDir)
    print('Generate Event Docs')
    await generateEventDocs({ rootDir })
    print('Generate Desktop Service Docs (Electron + Tauri + Dioxus)')
    await generateElectronDocs(rootDir)
    await generateTauriDocs(rootDir)
    await generateDioxusDocs(rootDir)
    print('Copy over Contributing Guidelines')
    await copyContributingDocs({ rootDir })
    print('Copy over Awesome Resources')
    await downloadAwesomeResources({ rootDir })
    if (skipTranslations) {
        print('English-only docs (skipping translation download)')
    } else {
        print('Download docs translations')
        const { downloadDocsTranslations } = await import('./downloadDocsTranslations.js')
        await downloadDocsTranslations({ rootDir })
    }

    writeSidebars(sidebars, websiteDir)

    console.log('=== Docs generated successfully! ===')
}

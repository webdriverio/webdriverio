import path from 'node:path'
import { getRootDir } from '@wdio/repo-utils'

import { generateProtocolDocs } from './protocolDocs.js'
import { generateWdioDocs } from './wdioDocs.js'
import { generateReportersAndServicesDocs } from './packagesDocs.js'
import { generate3rdPartyDocs } from './3rdPartyDocs.js'
import { generateElectronDocs } from './electronDocs.js'
import { generateTauriDocs } from './tauriDocs.js'
import { generateDioxusDocs } from './dioxusDocs.js'
import { generateEventDocs } from './eventDocs.js'
import { copyContributingDocs } from './copyContributingDocs.js'
import { downloadAwesomeResources } from './downloadAwesomeResources.js'
import { downloadDocsTranslations } from './downloadDocsTranslations.js'
import { print, writeSidebars } from './output.js'

export { print, writeSidebars } from './output.js'

export interface GenerateDocsOptions {
    rootDir?: string
    sidebars?: unknown
}

/**
 * NOTE: all generate docs functions mutate `sidebars` object!
 */
export async function generateDocs (options: GenerateDocsOptions = {}) {
    const rootDir = options.rootDir ?? getRootDir()
    const websiteDir = path.join(rootDir, 'website')
    const sidebars = options.sidebars ?? (
        await import(
            new URL(`file://${path.join(websiteDir, '_sidebars.json')}`).href,
            { with: { type: 'json' } }
        )
    ).default

    print('Generate Protocol Docs')
    generateProtocolDocs(sidebars, { websiteDir })
    print('Generate WebdriverIO Docs')
    await generateWdioDocs(sidebars, { rootDir })
    print('Generate Reporter & Services Docs')
    generateReportersAndServicesDocs(sidebars, { rootDir })
    await generate3rdPartyDocs(sidebars, { rootDir })
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
    print('Download docs translations')
    await downloadDocsTranslations({ rootDir })

    writeSidebars(sidebars, websiteDir)

    console.log('=== Docs generated successfully! ===')
}

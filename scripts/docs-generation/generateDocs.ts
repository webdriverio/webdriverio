#!/usr/bin/env node
import fs from 'node:fs'
import url from 'node:url'
import path from 'node:path'

import sidebars from '../../website/_sidebars.json' assert { type: 'json' }
import { generateProtocolDocs } from './protocolDocs.js'
import { generateWdioDocs } from './wdioDocs.js'
import { generateReportersAndServicesDocs } from './packagesDocs.js'
import { generate3rdPartyDocs } from './3rdPartyDocs.js'
import { copyContributingDocs } from './copyContributingDocs.js'
import { downloadAwesomeResources } from './downloadAwesomeResources.js'

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))

function print (title: string) {
    console.log(`
//////////////////////////////////////////////////
${title}
//////////////////////////////////////////////////`)
}

function writeSidebars(sidebars: any) {
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
    print('Copy over Contributing Guidelines')
    await copyContributingDocs()
    print('Copy over Awesome Resources')
    await downloadAwesomeResources()

    writeSidebars(sidebars)

    // eslint-disable-next-line no-console
    console.log('=== Docs generated successfully! ===')
} catch (err) {
    // eslint-disable-next-line no-console
    console.error(err)
    process.exit(1)
}


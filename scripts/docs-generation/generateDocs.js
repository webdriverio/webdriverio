#!/usr/bin/env node
const fs = require('fs')
const path = require('path')

const sidebars = require('../../website/_sidebars.json')
const { generateProtocolDocs } = require('./protocolDocs')
const { generateWdioDocs } = require('./wdioDocs')
const { generateReportersAndServicesDocs } = require('./packagesDocs')
const { generate3rdPartyDocs } = require('./3rdPartyDocs')

function print (title) {
    console.log(`
//////////////////////////////////////////////////
${title}
//////////////////////////////////////////////////`)
}

async function generateDocs() {
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

        writeSidebars(sidebars)
    } catch (err) {
        // eslint-disable-next-line no-console
        console.error(err)
        process.exit(1)
    }

    // eslint-disable-next-line no-console
    console.log('=== Docs generated successfully! ===')
}

function writeSidebars(sidebars) {
    fs.writeFileSync(
        path.join(__dirname, '..', '..', 'website', 'sidebars.json'),
        JSON.stringify(sidebars, null, 2),
        { encoding: 'utf-8' }
    )
}

generateDocs()

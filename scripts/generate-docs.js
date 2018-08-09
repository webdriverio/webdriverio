#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const ejs = require('../packages/wdio-cli/node_modules/ejs')

const config = require('../website/siteConfig')
const sidebars = require('../website/_sidebars.json')

const PROTOCOLS = {
    appium: require('../packages/webdriver/protocol/appium.json'),
    jsonwp: require('../packages/webdriver/protocol/jsonwp.json'),
    mjsonwp: require('../packages/webdriver/protocol/mjsonwp.json'),
    webdriver: require('../packages/webdriver/protocol/webdriver.json')
}
const PROTOCOL_NAMES = {
    appium: 'Appium',
    jsonwp: 'JSON Wire Protocol',
    mjsonwp: 'Mobile JSON Wire Protocol',
    webdriver: 'Webdriver Protocol'
}

const template = fs.readFileSync(path.join(__dirname, 'templates', 'api.tpl.ejs'), 'utf8')

for (const [protocolName, definition] of Object.entries(PROTOCOLS)) {
    const protocol = PROTOCOL_NAMES[protocolName]

    for (const [endpoint, methods] of Object.entries(definition)) {
        for (const [method, description] of Object.entries(methods)) {
            description.paramTags = [...(description.variables || []).map((variable) => {
                return Object.assign(variable, { required: true, type: 'String' })
            }), ...description.parameters || []]

            description.paramString = description.paramTags.map((param) => param.name).join(', ')
            description.examples = [] // tbd
            description.returnTags = [] // tbd
            description.throwsTags = [] // tbd
            description.customEditUrl = `${config.repoUrl}/edit/master/packages/webdriver/protocol/${protocolName}.json`

            if (!description.description) {
                description.description = `${protocol} command. More details can be found ` +
                    `in the [official protocol docs](${description.ref}).`
            }

            const docDir = path.join(__dirname, '..', 'docs', 'api', protocolName)
            if (!fs.existsSync(docDir)){
                fs.mkdirSync(docDir);
            }

            const markdown = ejs.render(template, { method: description }, {})
            const docPath = path.join(docDir, `${description.command}.md`)
            fs.writeFileSync(docPath, markdown, { encoding: 'utf-8' })

            /**
             * add command to sidebar
             */
            if (!sidebars.api[protocol]) {
                sidebars.api[protocol] = []
            }
            sidebars.api[protocol].push(`api/${protocolName}/${description.command}`)

            // eslint-disable-next-line no-console
            console.log(`Generated docs for ${method} ${endpoint} - ${docPath}`);
        }
    }
}

fs.writeFileSync(
    path.join(__dirname, '..', 'website', 'sidebars.json'),
    JSON.stringify(sidebars, null, 2),
    { encoding: 'utf-8' }
)

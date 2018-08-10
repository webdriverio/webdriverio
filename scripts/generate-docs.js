#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const markdox = require('markdox')

const formatter = require('./utils/formatter')
const compiler = require('./utils/compiler')
const ejs = require('../packages/wdio-cli/node_modules/ejs')

const config = require('../website/siteConfig')
const sidebars = require('../website/_sidebars.json')

ejs.open = '<?';
ejs.close = '?>';

const PROTOCOLS = {
    webdriver: require('../packages/webdriver/protocol/webdriver.json'),
    appium: require('../packages/webdriver/protocol/appium.json'),
    jsonwp: require('../packages/webdriver/protocol/jsonwp.json'),
    mjsonwp: require('../packages/webdriver/protocol/mjsonwp.json')
}
const PROTOCOL_NAMES = {
    appium: 'Appium',
    jsonwp: 'JSON Wire Protocol',
    mjsonwp: 'Mobile JSON Wire Protocol',
    webdriver: 'Webdriver Protocol'
}

const TEMPLATE_PATH = path.join(__dirname, 'templates', 'api.tpl.ejs')
const MARKDOX_OPTIONS = {
    formatter: formatter,
    compiler: compiler,
    template: TEMPLATE_PATH
}

const template = fs.readFileSync(TEMPLATE_PATH, 'utf8')

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

            const protocolNote = `${protocol} command. More details can be found in the [official protocol docs](${description.ref}).`
            if (description.description) {
                description.description += `<br><br>${protocolNote}`
            } else {
                description.description = protocolNote
            }

            const docDir = path.join(__dirname, '..', 'docs', 'api', protocolName)
            if (!fs.existsSync(docDir)){
                fs.mkdirSync(docDir);
            }

            const markdown = ejs.render(template, { docfiles: [description] }, {})
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

const COMMAND_DIR = path.join(__dirname, '..', 'packages', 'webdriverio', 'src', 'commands')
const COMMANDS = {
    browser: fs.readdirSync(path.join(COMMAND_DIR, 'browser')),
    element: fs.readdirSync(path.join(COMMAND_DIR, 'element'))
}

for (const [scope, files] of Object.entries(COMMANDS)) {
    for (const file of files) {
        const docDir = path.join(__dirname, '..', 'docs', 'api', scope)
        if (!fs.existsSync(docDir)){
            fs.mkdirSync(docDir);
        }

        const filepath = path.join(COMMAND_DIR, scope, file)
        const output = path.join(docDir, file.replace('js', 'md'))
        const options = Object.assign({}, MARKDOX_OPTIONS, { output })
        markdox.process(
            filepath,
            options,
            (err) => {
                if (err) {
                    // eslint-disable-next-line no-console
                    console.error(`ERROR: ${err.stack}`)
                }
                // eslint-disable-next-line no-console
                console.log(`Generated docs for ${scope}/${file} - ${output}`)
            }
        )
    }
}

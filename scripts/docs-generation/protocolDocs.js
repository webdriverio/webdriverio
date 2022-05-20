const fs = require('fs-extra')
const path = require('node:path')
const ejs = require('ejs')

const { repoUrl } = require('../../website/docusaurus.config.js')
const TEMPLATE_PATH = path.join(__dirname, '..', 'templates', 'api.tpl.ejs')
const {
    PROTOCOLS, PROTOCOL_NAMES, MOBILE_PROTOCOLS, VENDOR_PROTOCOLS, PROTOCOL_API_DESCRIPTION
} = require('../constants')

const category = 'api'
const PROJECT_ROOT_DIR = path.join(__dirname, '..', '..', 'website')
const API_DOCS_ROOT_DIR = path.join(PROJECT_ROOT_DIR, 'docs', category)

/**
 * Generate Protocol docs
 * @param {object} sidebars website/sidebars
 */
exports.generateProtocolDocs = (sidebars) => {
    fs.ensureDirSync(API_DOCS_ROOT_DIR)
    const template = fs.readFileSync(TEMPLATE_PATH, 'utf8')
    const protocolDocs = {}

    sidebars[category].push({
        type: 'category',
        label: 'Protocols',
        items: []
    })

    for (const [protocolName, definition] of Object.entries(PROTOCOLS)) {
        const protocol = PROTOCOL_NAMES[protocolName]

        for (const [, methods] of Object.entries(definition)) {
            for (const [, description] of Object.entries(methods)) {
                description.paramTags = [...(description.variables || []).map((variable) => {
                    return Object.assign(variable, { required: true, type: 'String' })
                }), ...description.parameters || []]

                description.hasHeader = true
                description.paramString = description.paramTags.map((param) => param.name).join(', ')
                description.examples = (description.examples || []).map((example) => {
                    return {
                        code: Array.isArray(example) ? example.join('\n') : example,
                        format: 'js'
                    }
                })
                description.returnTags = [] // tbd
                description.throwsTags = [] // tbd
                description.isMobile = MOBILE_PROTOCOLS.includes(protocolName)
                description.customEditUrl = `${repoUrl}/edit/main/packages/wdio-protocols/protocols/${protocolName}.json`

                let protocolNote
                if (VENDOR_PROTOCOLS.includes(protocolName)) {
                    protocolNote = `Non official and undocumented ${protocol} command.`
                    if (description.ref) {
                        protocolNote += ` More about this command can be found [here](${description.ref}).`
                    }
                } else {
                    protocolNote = `${protocol} command. More details can be found in the [official protocol docs](${description.ref}).`
                }

                if (description.description) {
                    description.description += `<br /><br />${protocolNote}`
                } else {
                    description.description = protocolNote
                }

                const markdown = ejs.render(template, { docfiles: [description] }, { delimiter: '?' })
                if (!protocolDocs[protocolName]) {
                    protocolDocs[protocolName] = [[
                        '---',
                        `id: ${protocolName}`,
                        `title: ${protocol}`,
                        `custom_edit_url: https://github.com/webdriverio/webdriverio/edit/main/packages/wdio-protocols/protocols/${protocolName}.json`,
                        '---\n',
                        'import Tabs from \'@theme/Tabs\';',
                        'import TabItem from \'@theme/TabItem\';\n'
                    ].join('\n')]

                    /**
                     * include API description if existent
                     */
                    if (Object.keys(PROTOCOL_API_DESCRIPTION).includes(protocolName)) {
                        protocolDocs[protocolName].push(PROTOCOL_API_DESCRIPTION[protocolName])
                    }
                }
                protocolDocs[protocolName].push(markdown)
            }
        }

        const docPath = path.join(API_DOCS_ROOT_DIR, `_${protocolName}.md`)
        const [preemble, ...apiDocs] = protocolDocs[protocolName]
        fs.writeFileSync(docPath, preemble + apiDocs.join('\n---\n'), { encoding: 'utf-8' })

        // eslint-disable-next-line no-console
        console.log(`Generated docs for ${protocolName} protocol`)

        sidebars[category][sidebars[category].length - 1].items.push(`${category}/${protocolName}`)
    }
}

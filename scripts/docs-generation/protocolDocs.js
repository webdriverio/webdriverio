const fs = require('fs')
const path = require('path')

const ejs = require('../../packages/wdio-cli/node_modules/ejs')
const config = require('../../website/siteConfig')
const TEMPLATE_PATH = path.join(__dirname, '..', 'templates', 'api.tpl.ejs')
const { PROTOCOLS, PROTOCOL_NAMES, MOBILE_PROTOCOLS, VENDOR_PROTOCOLS } = require('../constants')

/**
 * Generate Protocol docs
 * @param {object} sidebars website/sidebars
 */
exports.generateProtocolDocs = (sidebars) => {
    const template = fs.readFileSync(TEMPLATE_PATH, 'utf8')
    const protocolDocs = {}

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
                description.customEditUrl = `${config.repoUrl}/edit/master/packages/wdio-protocols/protocols/${protocolName}.json`

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
                    description.description += `<br><br>${protocolNote}`
                } else {
                    description.description = protocolNote
                }

                const markdown = ejs.render(template, { docfiles: [description] }, { delimiter: '?' })
                if (!protocolDocs[protocolName]) {
                    protocolDocs[protocolName] = [[
                        '---',
                        `id: ${protocolName}`,
                        `title: ${protocol}`,
                        `custom_edit_url: https://github.com/webdriverio/webdriverio/edit/master/packages/wdio-protocols/protocol/${protocolName}.json`,
                        '---\n'
                    ].join('\n')]
                }
                protocolDocs[protocolName].push(markdown)
            }
        }

        const docPath = path.join(__dirname, '..', '..', 'docs', 'api', `_${protocolName}.md`)
        fs.writeFileSync(docPath, protocolDocs[protocolName].join('\n---\n'), { encoding: 'utf-8' })

        // eslint-disable-next-line no-console
        console.log(`Generated docs for ${protocolName} protocol`)

        sidebars.api.Protocols.push(`api/${protocolName}`)
    }
}

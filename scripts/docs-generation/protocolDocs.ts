import fs from 'node:fs'
import path from 'node:path'
import url from 'node:url'

import ejs from 'ejs'

import { repoUrl } from '../constants.js'
import {
    PROTOCOLS, PROTOCOL_NAMES, MOBILE_PROTOCOLS, VENDOR_PROTOCOLS,
    PROTOCOL_API_DESCRIPTION
} from '../protocols.js'

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))
const TEMPLATE_PATH = path.join(__dirname, '..', 'templates', 'api.tpl.ejs')

const category = 'api'
const PROJECT_ROOT_DIR = path.join(__dirname, '..', '..', 'website')
const API_DOCS_ROOT_DIR = path.join(PROJECT_ROOT_DIR, 'docs', category)

/**
 * Generate Protocol docs
 * @param {object} sidebars website/sidebars
 */
export function generateProtocolDocs (sidebars: any) {
    fs.mkdir(API_DOCS_ROOT_DIR, { recursive: true }, (err) => console.error(err))
    const template = fs.readFileSync(TEMPLATE_PATH, 'utf8')
    const protocolDocs: any = {}

    const protocolDocEntry = {
        type: 'category',
        label: 'Protocols',
        link: {
            type: 'doc',
            id: 'api/protocols'
        },
        items: [] as any[]
    }

    for (const [protocolName, definition] of Object.entries(PROTOCOLS)) {
        const protocol = PROTOCOL_NAMES[protocolName as any as keyof typeof PROTOCOL_NAMES] as string

        for (const [, methods] of Object.entries(definition)) {
            for (const [, description] of Object.entries(methods) as any) {
                description.paramTags = [...(description.variables || []).map((variable: any) => {
                    return Object.assign(variable, { required: true, type: 'String' })
                }), ...description.parameters || []]

                description.hasHeader = true
                description.paramString = description.paramTags.map((param: any) => param.name).join(', ')
                description.examples = (description.examples || []).map((example: any) => {
                    return {
                        code: Array.isArray(example) ? example.join('\n') : example,
                        format: 'js'
                    }
                })
                description.returnTags = [] // tbd
                description.throwsTags = [] // tbd
                description.exampleReferences = description.exampleReferences || []
                description.isMobile = MOBILE_PROTOCOLS.includes(protocolName)
                description.customEditUrl = `${repoUrl}/edit/main/packages/wdio-protocols/src/protocols/${protocolName}.ts`

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

                const markdown = ejs.render(template, { docfiles: [description], path }, { delimiter: '?' })
                if (!protocolDocs[protocolName]) {
                    protocolDocs[protocolName] = [[
                        '---',
                        `id: ${protocolName}`,
                        `title: ${protocol}`,
                        `custom_edit_url: https://github.com/webdriverio/webdriverio/edit/main/packages/wdio-protocols/src/protocols/${protocolName}.ts`,
                        '---\n',
                        'import Tabs from \'@theme/Tabs\';',
                        'import TabItem from \'@theme/TabItem\';\n'
                    ].join('\n')]

                    /**
                     * include API description if existent
                     */
                    if (Object.keys(PROTOCOL_API_DESCRIPTION).includes(protocolName)) {
                        protocolDocs[protocolName].push(PROTOCOL_API_DESCRIPTION[protocolName as keyof typeof PROTOCOL_API_DESCRIPTION])
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

        protocolDocEntry.items.push(`${category}/${protocolName}`)
    }

    /**
     * Have API intro page first, then protocol commands, then general API docs last
     */
    const [api, ...rest] = sidebars[category]
    sidebars.api = [api, protocolDocEntry, ...rest]
}

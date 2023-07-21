import fs from 'node:fs'
import url from 'node:url'
import path from 'node:path'
import markdox from 'markdox'
import { promisify } from 'node:util'

import formatter from '../utils/formatter.js'
import compiler from '../utils/compiler.js'

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))
const TEMPLATE_PATH = path.join(__dirname, '..', 'templates', 'api.tpl.ejs')
const MARKDOX_OPTIONS = {
    formatter: formatter,
    compiler: compiler,
    template: TEMPLATE_PATH
}

const processDocs = promisify(markdox.process)

/**
 * Generate WebdriverIO docs
 * @param {object} sidebars website/sidebars
 */
export async function generateWdioDocs (sidebars) {
    const COMMAND_DIR = path.join(__dirname, '..', '..', 'packages', 'webdriverio', 'src', 'commands')
    const COMMANDS = {
        browser: ['api/browser', fs.readdirSync(path.join(COMMAND_DIR, 'browser'))],
        element: ['api/element', fs.readdirSync(path.join(COMMAND_DIR, 'element'))],
        mock: ['api/mock', fs.readdirSync(path.join(COMMAND_DIR, 'mock'))]
    }

    const apiDocs = []
    for (const [scope, [id, files]] of Object.entries(COMMANDS)) {
        /**
         * add scope to sidebar
         */
        apiDocs.push({
            type: 'category',
            label: scope,
            link: {
                type: 'doc',
                id
            },
            items: []
        })

        for (const file of files) {
            const docDir = path.join(__dirname, '..', '..', 'website', 'docs', 'api', scope)
            if (!fs.existsSync(docDir)){
                fs.mkdirSync(docDir)
            }

            const filepath = path.join(COMMAND_DIR, scope, file)
            const output = path.join(docDir, `_${file.replace(/(js|ts)/, 'md')}`)
            const options = Object.assign({}, MARKDOX_OPTIONS, { output })
            // eslint-disable-next-line no-undef
            globalThis.path = path
            await processDocs(filepath, options)
            console.log(`Generated docs for ${scope}/${file} - ${output}`)

            apiDocs[apiDocs.length - 1].items
                .push(`api/${scope}/${file.replace(/\.(js|ts)/, '')}`)
        }
    }

    /**
     * Have API intro page first, then protocol commands, then these and lastly
     * general API docs
     */
    const [api, protocol, ...rest] = sidebars.api
    sidebars.api = [api, protocol, ...apiDocs, ...rest]
}

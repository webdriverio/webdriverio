import fs from 'node:fs'
import url from 'node:url'
import path from 'node:path'
import dox from 'dox'
import { Eta } from 'eta'

import formatter from '../utils/formatter.js'
import compiler from '../utils/compiler.js'

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))
const TEMPLATE_PATH = path.join(__dirname, '..', 'templates')

const eta = new Eta({
    views: TEMPLATE_PATH,
    autoEscape: false,
})

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

            const raw = fs.readFileSync(filepath, 'utf-8')
            const data = compiler(filepath, raw)
            const doc = dox.parseComments(data, { raw: true })
            const docfile = {
                filename: filepath,
                javadoc: doc,
            }
            const formatedDocfile = formatter(docfile)
            const processedDoc = eta.render('./template', { ...formatedDocfile, path })
            fs.writeFileSync(output, processedDoc.replace(/\n{3,}/g, '\n\n'))
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

import fs from 'node:fs'
import url from 'node:url'
import path from 'node:path'
import dox from 'dox'
import mustache from 'mustache'

import formatter from '../utils/formatter.js'
import compiler from '../utils/compiler.js'

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))
const TEMPLATE_PATH = path.join(__dirname, '..', 'templates', 'template.mustache')

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
            formatedDocfile.renderUsage = function () {
                let usage
                if (this.isElementScope) {
                    usage = `$(selector).${this.command}(${this.paramString})`
                } else if (this.isMockScope) {
                    usage = `mock.${this.command}(${this.paramString})`
                } else {
                    usage = `${this.isMobile ? 'driver' : 'browser'}.${
                        this.command
                    }(${this.paramString})`
                }
                return usage
            }
            formatedDocfile.renderParamTags = function () {
                let returnValue = '\n'
                if (this.paramTags.length) {
                    returnValue += '##### Parameters\n\n| Name | Type | Details |\n| ---- | ---- | ------- |\n'
                    this.paramTags.forEach((paramTag) => {
                        const paramKey = Array.isArray(paramTag.types)
                            ? paramTag.types.map((type) => `<code>${type.replace(/>/g, '&gt;').replace(/</g, '&lt;')}</code>`).join('|')
                            : paramTag.type
                        returnValue += `| <code><var>${paramTag.name}</var></code>`
                        if ((!paramTag.required && typeof paramTag.optional === 'undefined') || paramTag.optional) {
                            returnValue += '<br /><span class="label labelWarning">optional</span>'
                        }
                        returnValue += ` | ${paramKey.split('|').join(', ').replace('(', '').replace(')', '')} | ${paramTag.description} |\n`
                    })
                }
                return returnValue
            }
            formatedDocfile.renderExamples = function () {
                let returnValue = ''
                const allExamples = [...this.examples, ...this.exampleReferences]
                if (this.examples.length || this.exampleReferences.length) {
                    returnValue += `##### Example${allExamples.length > 1 ? 's' : ''}\n\n`
                    this.exampleReferences.forEach((ref) => {
                        const filename = path.basename(ref.split('#')[0])
                        const ext = path.extname(filename).slice(1)
                        returnValue += `\`\`\`${ext} reference title="${filename}" useHTTPS\n${ref}\n\`\`\`\n\n`
                    })

                    this.examples.forEach((example) => {
                        returnValue += `\`\`\`${example.format} ${example.file ? `title="${example.file}"` : ''}\n${example.code}\n\`\`\`\n\n`
                    })
                }
                return returnValue
            }
            const template = fs.readFileSync(TEMPLATE_PATH, 'utf-8')
            const processedDoc = mustache.render(template, formatedDocfile)
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

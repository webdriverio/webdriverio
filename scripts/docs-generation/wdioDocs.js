const fs = require('fs')
const path = require('path')
const jsdoc2md = require('jsdoc-to-markdown')
const TEMPLATE_PATH = path.join(__dirname, '..', 'templates', 'api.tpl.ejs')

const processDocs = (jsdoc2md.render)

/**
 * Generate WebdriverIO docs
 * @param {object} sidebars website/sidebars
 */
exports.generateWdioDocs = async (sidebars) => {
    const COMMAND_DIR = path.join(__dirname, '..', '..', 'packages', 'webdriverio', 'src', 'commands')
    const COMMANDS = {
        browser: fs.readdirSync(path.join(COMMAND_DIR, 'browser')),
        element: fs.readdirSync(path.join(COMMAND_DIR, 'element')),
        mock: fs.readdirSync(path.join(COMMAND_DIR, 'mock'))
    }

    for (const [scope, files] of Object.entries(COMMANDS)) {
        /**
         * add scope to sidebar
         */
        sidebars.api.push({
            type: 'category',
            label: scope,
            items: []
        })

        for (const file of files) {
            const docDir = path.join(__dirname, '..', '..', 'website', 'docs', 'api', scope)
            if (!fs.existsSync(docDir)){
                fs.mkdirSync(docDir)
            }

            const filepath = path.join(COMMAND_DIR, scope, file)
            const outputpath = path.join(docDir, `_${file.replace(/(js|ts)/, 'md')}`)
            const out = await processDocs({data:[filepath],template:TEMPLATE_PATH })
            fs.writeFileSync(outputpath, out)
            
            console.log(`Generated docs for ${scope}/${file} - ${outputpath}`)
            sidebars.api[sidebars.api.length - 1].items
                .push(`api/${scope}/${file.replace(/\.(js|ts)/, '')}`)
        }
    }
}
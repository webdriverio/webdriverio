const fs = require('fs')
const path = require('path')
const markdox = require('markdox')

const formatter = require('../utils/formatter')
const compiler = require('../utils/compiler')
const TEMPLATE_PATH = path.join(__dirname, '..', 'templates', 'api.tpl.ejs')
const MARKDOX_OPTIONS = {
    formatter: formatter,
    compiler: compiler,
    template: TEMPLATE_PATH
}

/**
 * Generate WebdriverIO docs
 * @param {object} sidebars website/sidebars
 */
exports.generateWdioDocs = (sidebars) => {
    const COMMAND_DIR = path.join(__dirname, '..', '..', 'packages', 'webdriverio', 'src', 'commands')
    const COMMANDS = {
        browser: fs.readdirSync(path.join(COMMAND_DIR, 'browser')),
        element: fs.readdirSync(path.join(COMMAND_DIR, 'element')),
        network: fs.readdirSync(path.join(COMMAND_DIR, 'network')),
        mock: fs.readdirSync(path.join(COMMAND_DIR, 'mock'))
    }

    for (const [scope, files] of Object.entries(COMMANDS)) {
        for (const file of files) {
            const docDir = path.join(__dirname, '..', '..', 'docs', 'api', scope)
            if (!fs.existsSync(docDir)){
                fs.mkdirSync(docDir)
            }

            const filepath = path.join(COMMAND_DIR, scope, file)
            const output = path.join(docDir, `_${file.replace('js', 'md')}`)
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

            /**
             * add command to sidebar
             */
            if (!sidebars.api[scope]) {
                sidebars.api[scope] = []
            }
            sidebars.api[scope].push(`api/${scope}/${file.replace('.js', '')}`)
        }
    }
}

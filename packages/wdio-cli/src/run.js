import fs from 'fs'
import path from 'path'

import Launcher from './launcher.js'
import Watcher from './watcher'
import setup from './setup'

export default function run (params) {
    let stdinData = ''

    const firstArgument = params._[0]
    const commands = fs.readdirSync(path.join(__dirname, 'commands')).map((file) => path.parse(file).name)
    const localConf = path.join(process.cwd(), 'wdio.conf.js')
    const wdioConf = firstArgument || (fs.existsSync(localConf) ? localConf : null)

    /**
     * don't do anything if command handler is triggered
     */
    if (commands.includes(firstArgument)) {
        return
    }

    /**
     * if no default wdio.conf was found and no path to a wdio config was specified
     * run the setup
     */
    if (!wdioConf || firstArgument === 'config') {
        return setup()
    }

    /**
     * if `--watch` param is set, run launcher in watch mode
     */
    if (params.watch) {
        const watcher = new Watcher(wdioConf, params)
        return watcher.watch()
    }

    /**
     * if stdin.isTTY, then no piped input is present and launcher should be
     * called immediately, otherwise piped input is processed, expecting
     * a list of files to process.
     *
     * stdin.isTTY is false when command is from nodes spawn since it's treated as a pipe
     */
    if (process.stdin.isTTY || !process.stdout.isTTY) {
        return launch(wdioConf, params)
    }

    /*
     * get a list of spec files to run from stdin, overriding any other
     * configuration suite or specs.
     */
    const stdin = process.openStdin()
    stdin.setEncoding('utf8')
    stdin.on('data', (data) => {
        stdinData += data
    })
    stdin.on('end', () => {
        if (stdinData.length > 0) {
            params.specs = stdinData.trim().split(/\r?\n/)
        }
        launch(wdioConf, params)
    })
}

function launch (wdioConf, params) {
    const launcher = new Launcher(wdioConf, params)
    launcher.run().then(
        (code) => process.nextTick(() => process.exit(code)),
        (e) => process.nextTick(() => { throw e }))
}

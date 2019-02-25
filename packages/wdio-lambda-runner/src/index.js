import fs from 'fs'
import tmp from 'tmp'
import path from 'path'
import shell from 'shelljs'
import EventEmitter from 'events'
import findNodeModules from 'find-node-modules'

import logger from '@wdio/logger'
import { DEFAULT_CONFIG } from './constants'

const log = logger('@wdio/lambda-runner')

export default class AWSLambdaRunner extends EventEmitter {
    constructor (configFile, config, capabilities, specs) {
        super()

        const { AWS_ACCESS_KEY, AWS_ACCESS_KEY_ID } = process.env
        if (!AWS_ACCESS_KEY || !AWS_ACCESS_KEY_ID) {
            throw new Error('Please provide AWS_ACCESS_KEY, AWS_ACCESS_KEY_ID, AWS_BUCKET in your environment')
        }

        this.instances = []
        this.configFile = configFile
        this.config = config
        this.capabilities = capabilities
        this.specs = specs
        this.nodeModulesDir = path.resolve(findNodeModules()[0])

        this.pwd = shell.pwd().stdout
        this.serverlessBinPath = path.resolve(require.resolve('serverless'), '..', '..', 'bin', 'serverless')
    }

    async initialise () {
        /**
         * generate temp dir for AWS service
         */
        this.serviceDir = tmp.dirSync({
            prefix: '.wdio-runner-service',
            dir: process.cwd(),
            mode: '0750'
        })

        log.info('Generating temporary AWS Lamdba service directory at %s', this.serviceDir.name)

        /**
         * link node_modules
         */
        this.link(this.nodeModulesDir, path.resolve(this.serviceDir.name, 'node_modules'))

        /**
         * link wdio config
         */
        this.link(
            path.resolve(process.cwd(), this.configFile),
            path.resolve(this.serviceDir.name, this.configFile)
        )

        /**
         * link specs
         */
        this.specs.forEach((spec) => {
            this.link(spec, path.join(this.serviceDir.name, spec.replace(process.cwd(), '')))
        })

        /**
         * create config
         */
        const runnerConfig = Object.assign(DEFAULT_CONFIG, {
            environment: { DEBUG: 1 },
            package: {
                include: [],
                exclude: []
            }
        })

        /**
         * copy over files
         */
        shell.cp(path.resolve(__dirname, '..', 'config', 'serverless.yml'), path.resolve(this.serviceDir.name, 'serverless.yml'))
        shell.cp(path.resolve(__dirname, 'handler.js'), path.resolve(this.serviceDir.name, 'handler.js'))
        fs.writeFileSync(path.resolve(this.serviceDir.name, 'runner-config.json'), JSON.stringify(runnerConfig, null, 4))

        shell.cd(this.serviceDir.name)
        await this.exec(`${this.serverlessBinPath} deploy --verbose`)
        shell.cd(this.pwd)
    }

    /**
     * kill all instances that were started
     */
    kill () {
    }

    async run (options) {
        options.specs = options.specs.map((spec) => spec.replace(process.cwd(), '.'))
        shell.cd(this.serviceDir.name)

        let result
        try {
            result = await this.exec(`${this.serverlessBinPath} invoke -f run --data '${JSON.stringify(options)}' --verbose`)
        } catch (e) {
            log.error(`Failed to run Lambda process for cid ${options.cid}`)
        }
        shell.cd(this.pwd)
        this.emit(this.cid, result.failures === 0 ? 0 : 1)
    }

    link (source, dest) {
        log.debug('Linking: ', source, dest)
        fs.symlinkSync(source, dest)
    }

    exec (script) {
        log.debug(`Run script "${script}"`)
        return new Promise((resolve, reject) => {
            const child = shell.exec(script, { async: true, silent: true })
            child.stdout.on('data', (stdout) => {
                const trimmedStdout = stdout.trim().replace(/^Serverless: /, '')
                /**
                 * in case stdout is starting with `{` we assume it
                 * is the resulrt of serverless.run therefor return
                 * json
                 */
                if (trimmedStdout.startsWith('{')) {
                    return resolve(JSON.parse(trimmedStdout))
                }
                log.debug(trimmedStdout)
            })
            child.stderr.on('data', ::log.error)
            child.on('close', (code) => {
                /**
                 * ...otherwise resolve with status code
                 */
                if (code === 0) {
                    return resolve(code)
                }

                reject(new Error(`script failed with exit code ${code}`))
            })
        })
    }
}

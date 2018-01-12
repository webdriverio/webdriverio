import fs from 'fs'
import tmp from 'tmp'
import path from 'path'
import shell from 'shelljs'
import EventEmitter from 'events'
import findNodeModules from 'find-node-modules'

import logger from 'wdio-logger'
import { DEFAULT_CONFIG } from './constants'

const log = logger('wdio-lambda-runner')

export default class AWSLambdaRunner extends EventEmitter {
    constructor (config, capabilities, specs) {
        super()

        const { AWS_ACCESS_KEY, AWS_ACCESS_KEY_ID } = process.env
        if (!AWS_ACCESS_KEY || !AWS_ACCESS_KEY_ID) {
            throw new Error('Please provide AWS_ACCESS_KEY, AWS_ACCESS_KEY_ID, AWS_BUCKET in your environment')
        }

        this.instances = []
        this.config = config
        this.capabilities = capabilities
        this.specs = specs
        this.nodeModulesDir = path.resolve(findNodeModules()[0])

        this.pwd = shell.pwd().stdout
        this.serverlessBinPath = path.resolve(require.resolve('serverless'), '..', '..', 'bin', 'serverless')

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
        fs.symlinkSync(this.nodeModulesDir, path.resolve(this.serviceDir.name, 'node_modules'))

        /**
         * link specs
         */
        this.specs.forEach((spec) => {
            fs.symlinkSync(spec, path.join(this.serviceDir.name, spec.replace(process.cwd(), '')))
        })

        /**
         * create config
         */
        const runnerConfig = Object.assign(DEFAULT_CONFIG, {
            environment: {},
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
        shell.exec(`${this.serverlessBinPath} deploy -v`)
        shell.cd(this.pwd)
    }

    /**
     * kill all instances that were started
     */
    kill () {
    }

    run (options) {
        shell.cd(this.serviceDir.name)
        shell.exec(`${this.serverlessBinPath} invoke -f run --data '${JSON.stringify(options)}'`)
        shell.cd(this.pwd)
    }
}

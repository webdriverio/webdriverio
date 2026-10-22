import fs from 'node:fs'
import url from 'node:url'
import path from 'node:path'

import chokidar from 'chokidar'
import pickBy from 'lodash.pickby'
import flattenDeep from 'lodash.flattendeep'
import union from 'lodash.union'
import { minimatch } from 'minimatch'

import logger from '@wdio/logger'
import type { Capabilities, Workers } from '@wdio/types'

import Launcher from './launcher.js'
import type { RunCommandArguments, ValueKeyIteratee } from './types.js'

const log = logger('@wdio/cli:watch')

/**
 * characters that make a path segment a glob: `*`, `?`, `[]`, `{}` and extglobs like `@(a|b)`
 */
const GLOB_CHARACTERS = /[*?{}[\]]|[@+!]\(/

/**
 * Split an absolute path into the directory that has to be watched and the glob
 * pattern (relative to it, with `/` as separator). Segments that exist on disk are
 * taken literally, e.g. a checkout in `/work/app[1]`. Without a glob the pattern is empty.
 */
function splitGlob(absolutePath: string) {
    const segments = absolutePath.split(path.sep)
    const pathOf = (count: number) => {
        const joined = segments.slice(0, count).join(path.sep)
        return joined === '' || /^[A-Za-z]:$/.test(joined) ? joined + path.sep : joined
    }

    let literalCount = 1
    while (
        literalCount < segments.length &&
        (!GLOB_CHARACTERS.test(segments[literalCount]) || fs.existsSync(pathOf(literalCount + 1)))
    ) {
        literalCount++
    }
    if (literalCount >= segments.length) {
        return { root: absolutePath, pattern: '' }
    }

    // watch the closest directory that exists
    let rootCount = literalCount
    while (rootCount > 1 && !fs.existsSync(pathOf(rootCount))) {
        rootCount--
    }
    return {
        root: pathOf(rootCount),
        pattern: segments.slice(rootCount).join('/')
    }
}

type Spec = string | string[]
export default class Watcher {
    private _launcher: Launcher
    private _specs: Spec[] = []

    constructor(
        private _configFile: string,
        private _args: Omit<RunCommandArguments, 'configPath'>
    ) {
        log.info('Starting launcher in watch mode')
        this._launcher = new Launcher(this._configFile, this._args, true)
    }

    async watch() {
        await this._launcher.initialize()
        const specs = this._launcher.configParser.getSpecs()
        /**
         * specs from the `wdio:specs` capability need to be resolved like the launcher does,
         * so we get file URLs for them rather than the plain paths or globs from the config
         */
        const capSpecs = this._launcher.isMultiRemote
            ? []
            : union(flattenDeep(
                (this._launcher.configParser.getCapabilities() as Capabilities.RequestedStandaloneCapabilities[]).map((cap) => {
                    const caps = 'alwaysMatch' in cap ? cap.alwaysMatch : cap
                    const capSpecs = caps['wdio:specs']
                    return Array.isArray(capSpecs)
                        ? this._launcher.configParser.getSpecs(capSpecs, caps['wdio:exclude'])
                        : []
                }) as Spec[]
            ))
        this._specs = [...specs, ...capSpecs]

        /**
         * listen on spec changes and rerun specific spec file
         */
        const flattenedSpecs = flattenDeep(this._specs).map((fileUrl) => url.fileURLToPath(fileUrl))
        chokidar.watch(flattenedSpecs, { ignoreInitial: true })
            .on('add', this.getFileListener())
            .on('change', this.getFileListener())

        /**
         * listen on filesToWatch changes an rerun complete suite
         */
        const { filesToWatch } = this._launcher.configParser.getConfig()
        if (filesToWatch.length) {
            const rootDir = path.dirname(path.resolve(process.cwd(), this._configFile))
            const { paths, ignored } = this.resolveFilesToWatch(filesToWatch, rootDir)
            chokidar.watch(paths, { ignoreInitial: true, ...(ignored ? { ignored } : {}) })
                .on('add', this.getFileListener(false))
                .on('change', this.getFileListener(false))
        }

        /**
         * run initial test suite
         */
        await this._launcher.run()

        /**
         * clean interface once all worker finish
         */
        const workers = this.getWorkers()
        Object.values(workers).forEach((worker) => worker.on('exit', () => {
            /**
             * check if all workers have finished
             */
            if (Object.values(workers).find((w) => w.isBusy)) {
                return
            }

            this._launcher.interface?.finalise()
        }))
    }

    /**
     * chokidar 5 doesn't support glob patterns. Watch the directory a pattern starts in
     * instead and ignore every file that isn't matched by one of the patterns, so
     * files created after watch mode started are picked up too.
     * @param  {string[]} filesToWatch  `filesToWatch` config option
     * @param  {string}   rootDir       directory of the wdio config file
     * @return {object}                 paths to watch and chokidar `ignored` callback
     */
    private resolveFilesToWatch(filesToWatch: string[], rootDir: string) {
        const paths = new Set<string>()
        const literals: string[] = []
        const globs: { root: string, pattern: string }[] = []
        for (const file of filesToWatch) {
            const absolutePath = path.isAbsolute(file)
                ? path.normalize(file)
                : path.resolve(rootDir, file)
            const { root, pattern } = splitGlob(absolutePath)
            if (!pattern) {
                paths.add(absolutePath)
                literals.push(absolutePath)
                continue
            }
            paths.add(root)
            globs.push({ root, pattern })
        }

        const isWatched = (file: string, stats?: fs.Stats) => (
            literals.some((literal) => file === literal || file.startsWith(literal + path.sep)) ||
            globs.some(({ root, pattern }) => {
                if (file === root) {
                    return true
                }
                if (!file.startsWith(root.endsWith(path.sep) ? root : root + path.sep)) {
                    return false
                }
                const relativePath = path.relative(root, file).split(path.sep).join('/')
                /**
                 * Files have to match the pattern. Everything else (or when chokidar
                 * doesn't know yet) is kept if it can still lead to a match, so only
                 * directories that can't contain a match are skipped.
                 */
                return minimatch(relativePath, pattern, { dot: true, nonegate: true, partial: !stats?.isFile() })
            })
        )
        return {
            paths: [...paths],
            ignored: globs.length === 0
                ? undefined
                : (file: string, stats?: fs.Stats) => !isWatched(path.normalize(file), stats) // chokidar passes `/` separators on Windows
        }
    }

    /**
     * return file listener callback that calls `run` method
     * @param  {Boolean}  [passOnFile=true]  if true pass on file change as parameter
     * @return {Function}                    chokidar event callback
     */
    getFileListener(passOnFile = true) {
        return (spec: string) => {
            const runSpecs: Spec[] = []
            let singleSpecFound: boolean = false
            for (let index = 0, length = this._specs.length; index < length; index += 1) {
                const value = this._specs[index]
                if (Array.isArray(value) && value.indexOf(spec) > -1) {
                    runSpecs.push(value)
                } else if (!singleSpecFound && spec === value) {
                    // Only need to run a singleFile once  - so avoid duplicates
                    singleSpecFound = true
                    runSpecs.push(value)
                }
            }

            // If the runSpecs array is empty, then this must be a new file/array
            // so add the spec directly to the runSpecs
            if (runSpecs.length === 0) {
                runSpecs.push(url.pathToFileURL(spec).href)
            }

            // Do not pass the `spec` command line option to `this.run()`

            const { spec: _, ...args } = this._args
            return runSpecs.map((spec) => {
                return this.run({
                    ...args,
                    ...(passOnFile ? { spec: [spec] as string[] } : {})
                })
            })
        }
    }

    /**
     * helper method to get workers from worker pool of wdio runner
     * @param  predicate         filter by property value (see lodash.pickBy)
     * @param  includeBusyWorker don't filter out busy worker (default: false)
     * @return                   Object with workers, e.g. {'0-0': { ... }}
     */
    getWorkers(predicate?: ValueKeyIteratee<Workers.Worker> | null | undefined, includeBusyWorker?: boolean): Workers.WorkerPool {
        if (!this._launcher.runner) {
            throw new Error('Internal Error: no runner initialized, call run() first')
        }

        let workers = this._launcher.runner.workerPool

        if (typeof predicate === 'function') {
            workers = pickBy(workers, predicate)
        }

        /**
         * filter out busy workers, only skip if explicitly desired
         */
        if (!includeBusyWorker) {
            workers = pickBy(workers, (worker) => !worker.isBusy)
        }

        return workers
    }

    /**
     * run workers with params
     * @param  params parameters to run the worker with
     */
    run(params: Partial<RunCommandArguments> = {}) {
        const workers = this.getWorkers(
            (params.spec
                ? (worker) => Boolean(worker.specs.find((s) => params.spec?.includes(s)))
                : undefined)
        )

        /**
         * don't do anything if no worker was found
         */
        if (Object.keys(workers).length === 0 || !this._launcher.interface) {
            return
        }

        /**
         * update total worker count interface
         * ToDo: this should have a cleaner solution
         */
        this._launcher.interface.totalWorkerCnt = Object.entries(workers).length

        /**
         * clean up interface
         */
        this.cleanUp()

        /**
         * trigger new run for non busy worker
         */
        for (const [, worker] of Object.entries(workers)) {
            const { cid, capabilities, specs, sessionId } = worker
            const { hostname, path, port, protocol, automationProtocol } = worker.config
            const args = Object.assign({ sessionId, baseUrl: worker.config.baseUrl, hostname, path, port, protocol, automationProtocol }, params)
            worker.postMessage('run', args)
            this._launcher.interface.emit('job:start', { cid, caps: capabilities, specs })
        }
    }

    cleanUp() {
        this._launcher.interface?.setup()
    }
}

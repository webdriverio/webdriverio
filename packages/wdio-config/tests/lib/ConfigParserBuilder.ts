import { vi } from 'vitest'

import ConfigParser from '../../src/lib/ConfigParser.js'
import MockedModules from './MockedModules.js'
import type { FilePathsAndContents, MockSystemFolderPath } from './MockPathService.js'
import MockPathService from './MockPathService.js'

export default class ConfigParserBuilder {
    #args: any
    #configPath: string
    #f : MockPathService
    #m : MockedModules

    public constructor(baseDir: string, configPath: string, args: any, files: FilePathsAndContents = [], modules:[string, any][] = []) {
        this.#args = args
        this.#configPath = configPath
        this.#f = MockPathService.inWorkingDirectoryWithFiles({ cwd: baseDir, files })
        this.#m = MockedModules.withNoModules()
        this.withBaseDir(baseDir)
        this.withFiles(files)
        this.withModules(modules)
    }

    static withBaseDir(baseDir: MockSystemFolderPath, configPath: string, args: any = {}) : ConfigParserBuilder {
        return new ConfigParserBuilder(baseDir, configPath, args)
    }

    withBaseDir(baseDir: MockSystemFolderPath):ConfigParserBuilder {
        this.#f.withCwd(baseDir)
        return this
    }

    withFiles(files : FilePathsAndContents) :ConfigParserBuilder {
        this.#f.withFiles(files)
        return this
    }

    withNoModules():ConfigParserBuilder {
        this.#m.resetModules()
        return this
    }

    withModules(modulesAndValuesList: [string, any][]):ConfigParserBuilder {
        this.#m.withModules(modulesAndValuesList)
        return this
    }

    withTsNodeModule(registerMock = vi.fn()) {
        this.#m.withTsNodeModule(registerMock)
        return this
    }

    withTsconfigPathModule(registerMock = vi.fn()) {
        this.#m.withTsconfigPathModule(registerMock)
        return this
    }

    withBabelModule(registerMock = vi.fn()) {
        this.#m.withBabelModule(registerMock)
        return this
    }

    getMocks() {
        return {
            finder: this.#f,
            modules: this.#m
        }
    }

    build(): ConfigParser {
        return new ConfigParser(
            this.#configPath,
            this.#args,
            this.#f,
            this.#m
        )
    }
}

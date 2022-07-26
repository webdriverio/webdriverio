import { vi } from 'vitest'

import ConfigParser from '../../src/lib/ConfigParser'
import MockedModules from './MockedModules'
import MockPathService, { FilePathsAndContents, MockSystemFolderPath } from './MockPathService'

export default class ConfigParserBuilder {
    private f : MockPathService
    private m : MockedModules

    public constructor(baseDir: string, files: FilePathsAndContents = [], modules:[string, any][] = []) {
        this.f = MockPathService.inWorkingDirectoryWithFiles({ cwd: baseDir, files })
        this.m = MockedModules.withNoModules()
        this.withBaseDir(baseDir)
        this.withFiles(files)
        this.withModules(modules)
    }

    static withBaseDir(baseDir: MockSystemFolderPath) : ConfigParserBuilder {
        return new ConfigParserBuilder(baseDir)
    }

    withBaseDir(baseDir: MockSystemFolderPath):ConfigParserBuilder {
        this.f.withCwd(baseDir)
        return this
    }

    withFiles(files : FilePathsAndContents) :ConfigParserBuilder {
        this.f.withFiles(files)
        return this
    }

    withNoModules():ConfigParserBuilder {
        this.m.resetModules()
        return this
    }

    withModules(modulesAndValuesList: [string, any][]):ConfigParserBuilder {
        this.m.withModules(modulesAndValuesList)
        return this
    }

    withTsNodeModule(registerMock = vi.fn()) {
        this.m.withTsNodeModule(registerMock)
        return this
    }

    withTsconfigPathModule(registerMock = vi.fn()) {
        this.m.withTsconfigPathModule(registerMock)
        return this
    }

    withBabelModule(registerMock = vi.fn()) {
        this.m.withBabelModule(registerMock)
        return this
    }

    getMocks() {
        return {
            finder: this.f,
            modules: this.m
        }
    }

    build(): ConfigParser {
        return new ConfigParser(
            this.f,
            this.m
        )
    }
}

export interface PathService {
    // Get current working directory
    getcwd(): string
    // Require a .js/.json/dotfile config file
    loadFile<T>(path: string): Promise<T>
    // Detect if a file is present
    isFile(path: string): boolean
    ensureAbsolutePath(path: string): string
    // Glob to find file paths matching a pattern
    glob(pattern: string): string[]
}

export interface ModuleImportService {
    import<T>(module: string): Promise<T>
}

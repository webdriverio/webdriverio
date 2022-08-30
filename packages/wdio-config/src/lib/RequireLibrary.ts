import type { ModuleImportService } from '../types'

export default class RequireLibrary implements ModuleImportService {
    import<T>(module: string): Promise<T> {
        return import(module) as Promise<T>
    }
}

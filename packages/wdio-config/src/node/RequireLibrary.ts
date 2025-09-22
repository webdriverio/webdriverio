import type { ModuleImportService } from '../types.js'
import { createJiti } from 'jiti'

export default class RequireLibrary implements ModuleImportService {
    import<T>(module: string): Promise<T> {
        const jiti = createJiti(import.meta.url)
        return jiti.import(module) as Promise<T>
    }
}

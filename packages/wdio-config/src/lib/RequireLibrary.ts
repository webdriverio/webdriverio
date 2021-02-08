import { ModuleRequireService } from '../utils'

export default class RequireLibrary implements ModuleRequireService {
    require<T>(module: string): T {
        return require(module) as T
    }

    resolve(request: string, options: { paths?: string[] }): string {
        return require.resolve(request, options)
    }
}

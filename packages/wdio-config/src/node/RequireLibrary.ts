
import createJITI from 'jiti'

import type { ModuleImportService } from '../types.js'

export default class RequireLibrary implements ModuleImportService {
    #jiti = createJITI(import.meta.url)

    import<T>(module: string): Promise<T> {
        /**
         * we try to import the module first, if it fails we use jiti to load the module
         */
        return import(module).catch((err) => {
            /**
             * if the module is a CJS module and the import fails with a syntax error
             * it might be because the module does not export the named export
             * we can use jiti to load the module which will handle the named export
             */
            if (err instanceof Error && err.message.includes('does not provide an export named')) {
                return this.#jiti(module)
            }
            throw err
        }) as Promise<T>
    }
}

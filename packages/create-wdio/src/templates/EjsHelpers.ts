export interface EjsHelpersConfig {
    useEsm?: boolean;
    useTypeScript?: boolean;
}

export class EjsHelpers {
    public readonly useTypeScript: boolean
    public readonly useEsm: boolean

    constructor(config: EjsHelpersConfig) {
        this.useTypeScript = config.useTypeScript ?? false
        this.useEsm = config.useEsm ?? false
    }

    if(condition: boolean, trueValue: string, falseValue: string = '') {
        return condition
            ? trueValue
            : falseValue
    }

    ifTs = (trueValue: string, falseValue: string = '') =>
        this.if(this.useTypeScript, trueValue, falseValue)

    ifEsm = (trueValue: string, falseValue: string = '') =>
        this.if(this.useEsm, trueValue, falseValue)

    param(name: string, type: string) {
        return this.useTypeScript
            ? `${ name }: ${ type }`
            : name
    }

    returns(type: string) {
        return this.useTypeScript
            ? `: ${ type }`
            : ''
    }

    import(exports: string, moduleId: string) {
        const individualExports = exports.split(',').map(id => id.trim())

        const imports: string[] = this.useTypeScript
            ? individualExports
            : individualExports.filter(id => ! id.startsWith('type '))

        if (! imports.length) {
            return ''
        }

        const modulePath = this.modulePathFrom(moduleId)

        return this.useEsm || this.useTypeScript
            ? `import { ${ imports.join(', ') } } from '${ modulePath }'`
            : `const { ${ imports.join(', ') } } = require('${ modulePath }')`
    }

    private modulePathFrom(moduleId: string) {
        if (! (moduleId.startsWith('.') && this.useEsm)) {
            return moduleId
        }

        if (moduleId.endsWith('/') && this.useEsm) {
            return moduleId + 'index.js'
        }

        return moduleId + '.js'
    }

    export(keyword: 'class' | 'function' | 'const' | 'let', name: string) {
        if (this.useTypeScript) {
            return `export ${ keyword } ${ name }`
        }

        if (this.useEsm) {
            return `export ${ keyword } ${ name }`
        }

        if (['class', 'function'].includes(keyword)) {
            return `module.exports.${ name } = ${ keyword } ${ name }`
        }

        return `module.exports.${ name }`
    }
}

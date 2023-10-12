import { describe, it, expect } from 'vitest'

import { EjsHelpers } from '../../src/templates/EjsHelpers.js'

describe('EjsHelpers', () => {

    describe('if', () => {

        it('returns trueValue when condition is met', () => {
            const _ = new EjsHelpers({ useEsm: false, useTypeScript: false })
            const result = _.if(true, 'true', 'false')

            expect(result).toEqual('true')
        })

        it('returns falseValue when condition is not met', () => {
            const _ = new EjsHelpers({ useEsm: false, useTypeScript: false })
            const result = _.if(false, 'true', 'false')

            expect(result).toEqual('false')
        })
    })

    describe('ifTs', () => {

        it('returns trueValue when useTypeScript is true', () => {
            const _ = new EjsHelpers({ useEsm: false, useTypeScript: true })
            const result = _.ifTs('true', 'false')

            expect(result).toEqual('true')
        })

        it('returns falseValue when useTypeScript is false', () => {
            const _ = new EjsHelpers({ useEsm: false, useTypeScript: false })
            const result = _.ifTs('true', 'false')

            expect(result).toEqual('false')
        })

        it('returns blank when useTypeScript is false and falseValue is not defined', () => {
            const _ = new EjsHelpers({ useEsm: false, useTypeScript: false })
            const result = _.ifTs('true')

            expect(result).toEqual('')
        })
    })

    describe('ifEsm', () => {

        it('returns trueValue when useEsm is true', () => {
            const _ = new EjsHelpers({ useEsm: true, useTypeScript: false })
            const result = _.ifEsm('true', 'false')

            expect(result).toEqual('true')
        })

        it('returns falseValue when useEsm is false', () => {
            const _ = new EjsHelpers({ useEsm: false, useTypeScript: false })
            const result = _.ifEsm('true', 'false')

            expect(result).toEqual('false')
        })

        it('returns blank when useEsm is false and falseValue is not defined', () => {
            const _ = new EjsHelpers({ useEsm: false, useTypeScript: true })
            const result = _.ifEsm('true')

            expect(result).toEqual('')
        })
    })

    describe('param', () => {

        it('returns parameter name and type when useTypeScript is true', () => {
            const _ = new EjsHelpers({ useEsm: false, useTypeScript: true })
            const result = _.param('actor', 'Actor')

            expect(result).toEqual('actor: Actor')
        })

        it('returns parameter name when useTypeScript is false', () => {
            const _ = new EjsHelpers({ useEsm: false, useTypeScript: false })
            const result = _.param('actor', 'Actor')

            expect(result).toEqual('actor')
        })
    })

    describe('returns', () => {

        it('returns return type when useTypeScript is true', () => {
            const _ = new EjsHelpers({ useEsm: false, useTypeScript: true })
            const result = _.returns('string[]')

            expect(result).toEqual(': string[]')
        })

        it('returns blank when useTypeScript is false', () => {
            const _ = new EjsHelpers({ useEsm: false, useTypeScript: false })
            const result = _.returns('string[]')

            expect(result).toEqual('')
        })
    })

    describe('import', () => {

        const exports = 'By, contains, type Answerable'
        const moduleId = '@serenity-js/examples'
        const localDirectory = '../lib/'
        const localFile = '../lib/local'

        describe('when useTypeScript is true', () => {

            it('generates import statement for TypeScript, as-is', () => {
                const _ = new EjsHelpers({ useEsm: false, useTypeScript: true })

                const statement = _.import(exports, moduleId)

                expect(statement).toEqual(`import { ${ exports } } from '${ moduleId }'`)
            })

            describe('and useEsm is true', () => {

                it('adds index.js to the module path if it is relative and has a trailing slash', () => {
                    const _ = new EjsHelpers({ useEsm: true, useTypeScript: true })

                    const statement = _.import(exports, localDirectory)

                    expect(statement).toEqual(`import { ${ exports } } from '${ localDirectory }index.js'`)
                })

                it('adds .js to the module path if it is relative and has no trailing slash', () => {
                    const _ = new EjsHelpers({ useEsm: true, useTypeScript: true })
                    const statement = _.import(exports, localFile)

                    expect(statement).toEqual(`import { ${ exports } } from '${ localFile }.js'`)
                })
            })
        })

        describe('when useEsm is true', () => {

            const _ = new EjsHelpers({ useEsm: true, useTypeScript: false })

            it('generates import statement for ESM, removing any type imports', () => {
                const statement = _.import(exports, moduleId)

                expect(statement).toEqual(`import { By, contains } from '${ moduleId }'`)
            })

            it('prints nothing if there are no imports left', () => {
                const statement = _.import('type Actor', moduleId)

                expect(statement).toEqual('')
            })

            it('adds index.js to the module path if it is relative and has a trailing slash', () => {
                const statement = _.import(exports, localDirectory)

                expect(statement).toEqual(`import { By, contains } from '${ localDirectory }index.js'`)
            })

            it('adds .js to the module path if it is relative and has no trailing slash', () => {
                const statement = _.import(exports, localFile)

                expect(statement).toEqual(`import { By, contains } from '${ localFile }.js'`)
            })
        })

        describe('when both useEsm and useTypeScript are false', () => {

            const _ = new EjsHelpers({ useEsm: false, useTypeScript: false })

            it('generates import statement for CommonJS, removing any type imports', () => {

                const statement = _.import(exports, moduleId)

                expect(statement).toEqual(`const { By, contains } = require('${ moduleId }')`)
            })

            it('does not add index.js to the module path if it is relative and has a trailing slash', () => {
                const statement = _.import(exports, localDirectory)

                expect(statement).toEqual(`const { By, contains } = require('${ localDirectory }')`)
            })

            it('does not add .js to the module path if it is relative and has no trailing slash', () => {
                const statement = _.import(exports, localFile)

                expect(statement).toEqual(`const { By, contains } = require('${ localFile }')`)
            })
        })
    })

    describe('export', () => {

        describe('when useTypeScript is true', () => {

            const _ = new EjsHelpers({ useEsm: false, useTypeScript: true })

            it('generates export for a class', () => {
                const statement = _.export('class', 'MyClass')

                expect(statement).toEqual('export class MyClass')
            })

            it('generates export for a variable', () => {
                const statement = _.export('const', 'actor')

                expect(statement).toEqual('export const actor')
            })
        })

        describe('when useTypeScript is false and useEsm is true', () => {

            const _ = new EjsHelpers({ useEsm: true, useTypeScript: false })

            it('generates export for a class', () => {
                const statement = _.export('class', 'MyClass')

                expect(statement).toEqual('export class MyClass')
            })

            it('generates export for a variable', () => {
                const statement = _.export('const', 'actor')

                expect(statement).toEqual('export const actor')
            })
        })

        describe('when useTypeScript is false and useEsm is false', () => {

            const _ = new EjsHelpers({ useEsm: false, useTypeScript: false })

            it('generates export for a class', () => {
                const statement = _.export('class', 'MyClass')

                expect(statement).toEqual('module.exports.MyClass = class MyClass')
            })

            it('generates export for a variable', () => {
                const statement = _.export('const', 'actor')

                expect(statement).toEqual('module.exports.actor')
            })
        })
    })
})

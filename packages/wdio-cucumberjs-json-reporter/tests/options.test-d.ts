import { expectTypeOf, test } from 'vitest'
import type { CucumberJsJsonReporterInterface, MetadataObject, Scenario, Step } from '../src/types.js'
// @ts-expect-error not exported: the package does not use it
import type { FeatureMetadata } from '../src/types.js'

test('the options type has each documented option, with its type', () => {
    expectTypeOf<{ jsonFolder: string, language: string, disableHooks: boolean, reportFilePerRetry: boolean }>()
        .toExtend<CucumberJsJsonReporterInterface>()
    expectTypeOf<{ reportFilePerRetry: string }>().not.toExtend<CucumberJsJsonReporterInterface>()
})

test('capabilities accept the cjson:metadata of the report', () => {
    // an object literal: TypeScript checks for properties that the type does not have
    const capabilities: WebdriverIO.Capabilities = {
        browserName: 'chrome',
        'cjson:metadata': { device: 'MacBook Pro 15', platform: { name: 'OSX', version: '10.12.6' } }
    }
    expectTypeOf(capabilities).toExtend<WebdriverIO.Capabilities>()
    // @ts-expect-error the device is a string
    const wrong: WebdriverIO.Capabilities = { 'cjson:metadata': { device: 1 } }
    expectTypeOf(wrong).toExtend<WebdriverIO.Capabilities>()
})

test('the public types have no fields that only the tests used', () => {
    expectTypeOf<Scenario>().not.toHaveProperty('foo')
    expectTypeOf<Scenario>().not.toHaveProperty('bar')
    expectTypeOf<Scenario>().not.toHaveProperty('foobar')
    expectTypeOf<Step>().not.toHaveProperty('foo')
    expectTypeOf<MetadataObject>().not.toHaveProperty('foo')
})

test('the public types have no type that the package does not use', () => {
    expectTypeOf<FeatureMetadata>().toBeAny()
})

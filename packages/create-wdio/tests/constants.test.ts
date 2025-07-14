import { describe, it, expect } from 'vitest'

import { convertPackageHashToObject } from '../src/utils.js'
import { SUPPORTED_PACKAGES } from '../src/constants.js'

const supportedInstallations = [
    ...SUPPORTED_PACKAGES.runner.map(({ value }) => convertPackageHashToObject(value)),
    ...SUPPORTED_PACKAGES.plugin.map(({ value }) => convertPackageHashToObject(value)),
    ...SUPPORTED_PACKAGES.service.map(({ value }) => convertPackageHashToObject(value)),
    ...SUPPORTED_PACKAGES.reporter.map(({ value }) => convertPackageHashToObject(value)),
    ...SUPPORTED_PACKAGES.framework.map(({ value }) => convertPackageHashToObject(value))
]

describe('constants', () => {
    describe('plugin list', () => {
        it('should provide all a short name', () => {
            const pluginsWithoutShorts = supportedInstallations.filter((plugin) => !plugin.short)
            expect(pluginsWithoutShorts).toHaveLength(0)
        })
    })
})

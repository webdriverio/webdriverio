import { describe, it, expect } from 'vitest'

import { convertPackageHashToObject } from '../src/utils.js'
import { buildTauriBanner, buildDioxusBanner, getResolvedPurpose, SUPPORTED_PACKAGES, DesktopFrameworkChoice, TauriDriverProviderChoice, DioxusDriverProviderChoice } from '../src/constants.js'

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

    describe('desktop testing runner', () => {
        const runnerEntry = SUPPORTED_PACKAGES.runner.find(
            ({ value }) => convertPackageHashToObject(value).purpose === 'desktop'
        )
        const desktopAnswers = (framework?: DesktopFrameworkChoice) => ({
            runner: runnerEntry!.value,
            desktopFramework: framework
        }) as any

        it('exposes a single Desktop Testing entry', () => {
            expect(runnerEntry).toBeTruthy()
            const desktopRunners = SUPPORTED_PACKAGES.runner.filter(
                ({ value }) => ['electron', 'macos'].includes(convertPackageHashToObject(value).purpose)
            )
            expect(desktopRunners).toHaveLength(0)
        })

        it('uses the new scoped @wdio/electron-service package', () => {
            const electron = SUPPORTED_PACKAGES.service.find(({ name }) => name === 'electron')!
            expect(convertPackageHashToObject(electron.value).package).toBe('@wdio/electron-service')
        })

        it('exposes @wdio/tauri-service and @wdio/tauri-plugin', () => {
            const tauri = SUPPORTED_PACKAGES.service.find(({ name }) => name === 'tauri')!
            const tauriPlugin = SUPPORTED_PACKAGES.service.find(({ name }) => name === 'tauri-plugin')!
            expect(convertPackageHashToObject(tauri.value).package).toBe('@wdio/tauri-service')
            expect(convertPackageHashToObject(tauriPlugin.value).package).toBe('@wdio/tauri-plugin')
        })

        it('exposes @wdio/dioxus-service', () => {
            const dioxus = SUPPORTED_PACKAGES.service.find(({ name }) => name === 'dioxus')!
            expect(convertPackageHashToObject(dioxus.value).package).toBe('@wdio/dioxus-service')
        })

        it('resolves the desktop sub-question into a concrete purpose', () => {
            expect(getResolvedPurpose(desktopAnswers(DesktopFrameworkChoice.Electron))).toBe('electron')
            expect(getResolvedPurpose(desktopAnswers(DesktopFrameworkChoice.Tauri))).toBe('tauri')
            expect(getResolvedPurpose(desktopAnswers(DesktopFrameworkChoice.Dioxus))).toBe('dioxus')
            expect(getResolvedPurpose(desktopAnswers(DesktopFrameworkChoice.MacOS))).toBe('macos')
            expect(getResolvedPurpose(desktopAnswers())).toBe('electron')
        })
    })

    describe('buildTauriBanner', () => {
        it('emits Cargo crate instructions for the embedded driver', () => {
            const banner = buildTauriBanner(TauriDriverProviderChoice.Embedded, false)
            expect(banner).toContain('tauri-plugin-wdio-webdriver = "1"')
            expect(banner).toContain('Register the plugin')
        })

        it('emits cargo install instructions for the official driver', () => {
            const banner = buildTauriBanner(TauriDriverProviderChoice.Official, false)
            expect(banner).toContain('cargo install tauri-driver')
        })

        it('appends frontend-plugin guidance when selected', () => {
            const banner = buildTauriBanner(TauriDriverProviderChoice.Embedded, true)
            expect(banner).toContain('@wdio/tauri-plugin')
        })
    })

    describe('buildDioxusBanner', () => {
        it('emits the Cargo bridge-crate instructions', () => {
            const banner = buildDioxusBanner(DioxusDriverProviderChoice.Embedded)
            expect(banner).toContain('wdio-dioxus-bridge = "1"')
            expect(banner).toContain('wdio_dioxus_bridge::install')
        })

        it('adds driver-install instructions for the external provider', () => {
            const banner = buildDioxusBanner(DioxusDriverProviderChoice.External)
            expect(banner).toContain('cargo install wdio-dioxus-driver')
        })
    })
})

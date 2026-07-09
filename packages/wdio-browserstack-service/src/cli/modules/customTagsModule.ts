/// <reference path="../../@types/bstack-service-types.d.ts" />
import BaseModule from './baseModule.js'
import { BStackLogger } from '../cliLogger.js'
import TestFramework from '../frameworks/testFramework.js'
import AutomationFramework from '../frameworks/automationFramework.js'
import type AutomationFrameworkInstance from '../instances/automationFrameworkInstance.js'
import type TestFrameworkInstance from '../instances/testFrameworkInstance.js'
import { AutomationFrameworkState } from '../states/automationFrameworkState.js'
import { HookState } from '../states/hookState.js'
import { TestFrameworkState } from '../states/testFrameworkState.js'
import { TestFrameworkConstants } from '../frameworks/constants/testFrameworkConstants.js'
import { CLIUtils } from '../cliUtils.js'
import WdioMochaTestFramework from '../frameworks/wdioMochaTestFramework.js'
import { mergeIntoTags, parseCommaSeparatedValues, extractCaseIdsFromTitle, resolveTitleTagConfig } from '../../customTags.js'
import type { CustomMetadata } from '../../customTags.js'

/**
 * CustomTagsModule — CLI/gRPC path registration for `browser.setCustomTags`.
 *
 * Mirrors AccessibilityModule: registers the browser method in onBeforeExecute()
 * (observer-bound to AutomationFrameworkState.CREATE / HookState.POST), instantiated
 * from BrowserstackCLI.loadModules() whenever the binary is up.
 *
 * The per-test custom_metadata is merged directly into the tracked
 * TestFrameworkInstance map under KEY_CUSTOM_TAGS ('custom_metadata'). That whole
 * map is serialized verbatim into event_json (testHubModule.sendTestFrameworkEvent),
 * so the binary reads it as event.custom_metadata. The instance is created fresh
 * per test, so per-instance merge gives test-scoped union/dedupe; the binary is a
 * strict pass-through and does NOT consolidate across events.
 */
export default class CustomTagsModule extends BaseModule {

    logger = BStackLogger
    name: string
    static MODULE_NAME = 'CustomTagsModule'

    constructor() {
        super()
        this.name = 'CustomTagsModule'
        AutomationFramework.registerObserver(AutomationFrameworkState.CREATE, HookState.POST, this.onBeforeExecute.bind(this))
        // Opt-in title-based tagging: derive Test-Case-IDs from each test's title at
        // test start (before any mid-test setCustomTags call, so the two union).
        TestFramework.registerObserver(TestFrameworkState.TEST, HookState.PRE, this.onBeforeTest.bind(this))
    }

    getModuleName() {
        return CustomTagsModule.MODULE_NAME
    }

    async onBeforeExecute() {
        try {
            const autoInstance: AutomationFrameworkInstance = AutomationFramework.getTrackedInstance()
            if (!autoInstance) {
                this.logger.debug('CustomTagsModule: No tracked automation instance found!')
                return
            }

            const browser = AutomationFramework.getDriver(autoInstance) as WebdriverIO.Browser
            if (!browser) {
                this.logger.debug('CustomTagsModule: No browser instance found for setCustomTags registration')
                return
            }

            (browser as WebdriverIO.Browser).setCustomTags = async (key: string, value: string): Promise<void> => {
                try {
                    if (!key || !value) {
                        this.logger.warn('setCustomTags: key and value are required; ignoring call')
                        return
                    }

                    const testInstance: TestFrameworkInstance = TestFramework.getTrackedInstance()
                    if (!testInstance) {
                        this.logger.warn('setCustomTags called outside of a resolvable test context; ignoring')
                        return
                    }

                    const values = parseCommaSeparatedValues(value)
                    if (values.length === 0) {
                        this.logger.warn(`setCustomTags: no usable values parsed from "${value}"; ignoring call`)
                        return
                    }

                    // Merge into the per-test instance map (test-scoped accumulator).
                    const existing = (TestFramework.getState(testInstance, TestFrameworkConstants.KEY_CUSTOM_TAGS) as CustomMetadata) || {}
                    mergeIntoTags(existing, key, values)
                    testInstance.updateMultipleEntries({
                        [TestFrameworkConstants.KEY_CUSTOM_TAGS]: existing
                    })

                    // Hook-level: if a hook is currently active, also stamp custom_metadata
                    // onto the active hook so binary reads hook.custom_metadata.
                    this.applyToActiveHook(testInstance, key, values)

                    this.logger.debug(`setCustomTags: merged key=${key} values=${JSON.stringify(values)}`)
                } catch (error) {
                    this.logger.warn(`setCustomTags: error while recording custom tags: ${error}`)
                }
            }
        } catch (error) {
            this.logger.error(`Error in CustomTagsModule.onBeforeExecute: ${error}`)
        }
    }

    /**
     * Opt-in title-based tagging (TestRail-style): at each test start, derive
     * Test-Case-IDs from the test title and merge them into the tracked instance's
     * custom_metadata under the configured key — via the SAME merge path as explicit
     * setCustomTags, so title-derived and programmatic tags union. Gated by
     * resolveTitleTagConfig() (env-published at beforeSession); a safe no-op when
     * disabled or nothing matches.
     */
    async onBeforeTest(args: Record<string, unknown>) {
        try {
            const titleCfg = resolveTitleTagConfig()
            if (!titleCfg) {
                return
            }
            const test = args.test as { title?: string } | undefined
            const ids = extractCaseIdsFromTitle(test?.title, titleCfg.pattern)
            if (ids.length === 0) {
                return
            }
            // Prefer the tracked instance (the SAME one the explicit setCustomTags
            // closure reads/writes) so title-derived and programmatic tags union.
            const testInstance = TestFramework.getTrackedInstance() || (args.instance as TestFrameworkInstance)
            if (!testInstance) {
                return
            }
            const existing = (TestFramework.getState(testInstance, TestFrameworkConstants.KEY_CUSTOM_TAGS) as CustomMetadata) || {}
            mergeIntoTags(existing, titleCfg.key, ids)
            testInstance.updateMultipleEntries({
                [TestFrameworkConstants.KEY_CUSTOM_TAGS]: existing
            })
            this.logger.debug(`setCustomTags(title): merged key=${titleCfg.key} values=${JSON.stringify(ids)} from title="${test?.title}"`)
        } catch (error) {
            this.logger.debug(`setCustomTags(title): error deriving tags from title: ${error}`)
        }
    }

    /**
     * If the test framework is currently inside a hook, merge custom_metadata onto
     * the last-started hook record so the binary receives hook.custom_metadata.
     * Best-effort: silently no-ops when no active hook is resolvable.
     */
    private applyToActiveHook(testInstance: TestFrameworkInstance, key: string, values: string[]) {
        try {
            const currentState = testInstance.getCurrentTestState().toString()
            if (!CLIUtils.matchHookRegex(currentState)) {
                return
            }
            const hook = WdioMochaTestFramework.lastActiveHook(testInstance, WdioMochaTestFramework.KEY_HOOK_LAST_STARTED)
            if (!hook) {
                return
            }
            const hookTags = (hook[TestFrameworkConstants.KEY_CUSTOM_TAGS] as CustomMetadata) || {}
            mergeIntoTags(hookTags, key, values)
            hook[TestFrameworkConstants.KEY_CUSTOM_TAGS] = hookTags
        } catch (error) {
            this.logger.debug(`setCustomTags: could not apply to active hook: ${error}`)
        }
    }
}

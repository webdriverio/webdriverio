/**
 * Module Hook Tracker - Tracks lifecycle events for SDK modules
 * Provides performance instrumentation for module initialization and cleanup
 */

import PerformanceTester from './instrumentation/performance/performance-tester.js'
import { MODULE_HOOK_EVENTS } from './constants.js'

/**
 * Module lifecycle hooks interface
 */
export interface ModuleLifecycleHooks {
    onStart?: () => Promise<void> | void
    onStop?: () => Promise<void> | void
    onDriverInit?: () => Promise<void> | void
    initSession?: () => Promise<void> | void
    beforeSession?: () => Promise<void> | void
}

/**
 * Module types that are tracked
 */
export type TrackedModule =
    | 'instrumentation'
    | 'testhub'
    | 'observability'
    | 'percy'
    | 'accessibility'
    | 'ai'
    | 'local'
    | 'appautomate'

/**
 * Tracks module hook execution with performance measurement
 */
export class ModuleHookTracker {
    private static instance: ModuleHookTracker

    private constructor() {
        // Private constructor for singleton
    }

    static getInstance(): ModuleHookTracker {
        if (!ModuleHookTracker.instance) {
            ModuleHookTracker.instance = new ModuleHookTracker()
        }
        return ModuleHookTracker.instance
    }

    /**
     * Get event name for a module hook
     */
    private getEventName(module: TrackedModule, hook: keyof ModuleLifecycleHooks): string | undefined {
        const eventMap: Record<string, string> = {
            'instrumentation:onStart': MODULE_HOOK_EVENTS.INSTRUMENTATION_ON_START,
            'instrumentation:onStop': MODULE_HOOK_EVENTS.INSTRUMENTATION_ON_STOP,
            'testhub:onStart': MODULE_HOOK_EVENTS.TESTHUB_ON_START,
            'testhub:onStop': MODULE_HOOK_EVENTS.TESTHUB_ON_STOP,
            'observability:onStart': MODULE_HOOK_EVENTS.OBSERVABILITY_ON_START,
            'observability:onStop': MODULE_HOOK_EVENTS.OBSERVABILITY_ON_STOP,
            'percy:onStart': MODULE_HOOK_EVENTS.PERCY_ON_START,
            'percy:onStop': MODULE_HOOK_EVENTS.PERCY_ON_STOP,
            'accessibility:onStart': MODULE_HOOK_EVENTS.ACCESSIBILITY_ON_START,
            'accessibility:onStop': MODULE_HOOK_EVENTS.ACCESSIBILITY_ON_STOP,
            'accessibility:onDriverInit': MODULE_HOOK_EVENTS.ACCESSIBILITY_ON_DRIVER_INIT,
            'ai:onStart': MODULE_HOOK_EVENTS.AI_ON_START,
            'ai:onStop': MODULE_HOOK_EVENTS.AI_ON_STOP,
            'ai:beforeSession': MODULE_HOOK_EVENTS.AI_BEFORE_SESSION,
            'ai:onDriverInit': MODULE_HOOK_EVENTS.AI_ON_DRIVER_INIT,
            'local:onStart': MODULE_HOOK_EVENTS.LOCAL_ON_START,
            'local:onStop': MODULE_HOOK_EVENTS.LOCAL_ON_STOP,
            'local:initSession': MODULE_HOOK_EVENTS.LOCAL_INIT_SESSION,
            'local:onDriverInit': MODULE_HOOK_EVENTS.LOCAL_ON_DRIVER_INIT,
            'appautomate:onStart': MODULE_HOOK_EVENTS.APPAUTOMATE_ON_START,
            'appautomate:onDriverInit': MODULE_HOOK_EVENTS.APPAUTOMATE_ON_DRIVER_INIT,
        }
        return eventMap[`${module}:${hook}`]
    }

    /**
     * Track a module hook execution with performance measurement
     */
    async trackHook<T>(
        module: TrackedModule,
        hook: keyof ModuleLifecycleHooks,
        fn: () => Promise<T> | T
    ): Promise<T> {
        const eventName = this.getEventName(module, hook)
        if (!eventName) {
            // Hook not tracked for this module, execute without tracking
            return await fn()
        }

        try {
            PerformanceTester.start(eventName)
            const result = await fn()
            PerformanceTester.end(eventName)
            return result
        } catch (error) {
            PerformanceTester.end(eventName, false, error instanceof Error ? error.message : String(error))
            throw error
        }
    }

    /**
     * Convenience methods for tracking specific hooks
     */
    async trackOnStart<T = void>(module: TrackedModule, fn: () => Promise<T> | T): Promise<T> {
        return this.trackHook(module, 'onStart', fn)
    }

    async trackOnStop<T = void>(module: TrackedModule, fn: () => Promise<T> | T): Promise<T> {
        return this.trackHook(module, 'onStop', fn)
    }

    async trackOnDriverInit<T = void>(module: TrackedModule, fn: () => Promise<T> | T): Promise<T> {
        return this.trackHook(module, 'onDriverInit', fn)
    }

    async trackInitSession<T = void>(module: TrackedModule, fn: () => Promise<T> | T): Promise<T> {
        return this.trackHook(module, 'initSession', fn)
    }

    async trackBeforeSession<T = void>(module: TrackedModule, fn: () => Promise<T> | T): Promise<T> {
        return this.trackHook(module, 'beforeSession', fn)
    }
}

/**
 * Global instance export for convenience
 */
export const moduleHookTracker = ModuleHookTracker.getInstance()

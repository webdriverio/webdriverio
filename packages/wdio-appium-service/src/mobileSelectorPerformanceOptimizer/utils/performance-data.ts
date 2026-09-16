import type { TestContext, SelectorPerformanceData, CommandTiming } from '../types.js'
import { addPerformanceData, getCurrentDeviceName } from '../mspo-store.js'

/**
 * Creates optimized selector performance data object.
 */
export function createOptimizedSelectorData(
    testContext: TestContext,
    originalSelector: string,
    originalDuration: number,
    optimizedSelector: string,
    optimizedDuration: number
): SelectorPerformanceData {
    const timeDifference = originalDuration - optimizedDuration
    const improvementPercent = originalDuration > 0 ? (timeDifference / originalDuration) * 100 : 0

    return {
        testFile: testContext.testFile || 'unknown',
        suiteName: testContext.suiteName,
        testName: testContext.testName,
        lineNumber: testContext.lineNumber,
        selectorFile: testContext.selectorFile,
        selector: originalSelector,
        selectorType: 'xpath',
        duration: originalDuration,
        timestamp: Date.now(),
        deviceName: getCurrentDeviceName(),
        optimizedSelector: optimizedSelector,
        optimizedDuration: optimizedDuration,
        improvementMs: timeDifference,
        improvementPercent: improvementPercent
    }
}

/**
 * Stores performance data for a selector operation.
 */
export function storePerformanceData(
    timing: CommandTiming,
    duration: number,
    testContext: TestContext
): void {
    const data: SelectorPerformanceData = {
        testFile: testContext.testFile || 'unknown',
        suiteName: testContext.suiteName,
        testName: testContext.testName,
        lineNumber: testContext.lineNumber,
        selector: timing.selector,
        selectorType: timing.selectorType!,
        duration,
        timestamp: Date.now(),
        deviceName: getCurrentDeviceName()
    }

    addPerformanceData(data)
}

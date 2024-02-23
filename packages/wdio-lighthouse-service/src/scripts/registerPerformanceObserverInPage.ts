declare global {
    interface Window {
        ____lastLongTask: number
        ____lhPerformanceObserver: PerformanceObserver
    }
}

/**
 * Used by _waitForCPUIdle and executed in the context of the page, updates the ____lastLongTask
 * property on window to the end time of the last long task.
 */

export default function registerPerformanceObserverInPage () {
    window.____lastLongTask = window.performance.now()
    const observer = new window.PerformanceObserver(entryList => {
        const entries = entryList.getEntries()
        for (const entry of entries) {
            if (entry.entryType === 'longtask') {
                const taskEnd = entry.startTime + entry.duration
                window.____lastLongTask = Math.max(window.____lastLongTask, taskEnd)
            }
        }
    })

    observer.observe({ entryTypes: ['longtask'] })
    // HACK: A PerformanceObserver will be GC'd if there are no more references to it, so attach it to
    // window to ensure we still receive longtask notifications. See https://crbug.com/742530.
    // For an example test of this behavior see https://gist.github.com/patrickhulce/69d8bed1807e762218994b121d06fea6.
    //   FIXME COMPAT: This hack isn't neccessary as of Chrome 62.0.3176.0
    //   https://bugs.chromium.org/p/chromium/issues/detail?id=742530#c7
    window.____lhPerformanceObserver = observer
}

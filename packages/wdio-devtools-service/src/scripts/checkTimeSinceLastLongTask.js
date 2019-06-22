/**
 * Used by _waitForCPUIdle and executed in the context of the page, returns time since last long task.
 */
export default function checkTimeSinceLastLongTask () {
    // Wait for a delta before returning so that we're sure the PerformanceObserver
    // has had time to register the last longtask
    return new Promise(resolve => {
        const timeoutRequested = window.performance.now() + 50

        setTimeout(() => {
            // Double check that a long task hasn't happened since setTimeout
            const timeoutFired = window.performance.now()
            const timeSinceLongTask = timeoutFired - timeoutRequested < 50
                ? timeoutFired - window.____lastLongTask : 0
            resolve(timeSinceLongTask)
        }, 50)
    })
}

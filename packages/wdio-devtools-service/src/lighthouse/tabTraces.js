/**
 * @license Copyright 2016 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

/**
 * NOTE: This code is copied and adapted from the Lighthouse project
 * https://github.com/GoogleChrome/lighthouse
 */

import stableSort from 'stable'
import logger from 'wdio-logger'
import LHError from './errors'

const log = logger('wdio-devtools-service:TraceOfTab')

/**
 * @fileoverview Singluar helper to parse a raw trace and extract the most useful data for
 * various tools. This artifact will take a trace and then:
 *
 * 1. Find the TracingStartedInPage and navigationStart events of our intended tab & frame.
 * 2. Find the firstContentfulPaint and marked firstMeaningfulPaint events
 * 3. Isolate only the trace events from the tab's process (including all threads like compositor)
 *      * Sort those trace events in chronological order (as order isn't guaranteed)
 * 4. Return all those items in one handy bundle.
 */
export default class TraceOfTab {
    /**
     * Finds key trace events, identifies main process/thread, and returns timings of trace events
     * in milliseconds since navigation start in addition to the standard microsecond monotonic timestamps.
     * @param {{traceEvents: !Array}} trace
     * @return {LH.Artifacts.TraceOfTab}
     */
    static compute (trace) {
        // Parse the trace for our key events and sort them by timestamp. Note: sort
        // *must* be stable to keep events correctly nested.
        const keyEvents = stableSort(trace.traceEvents.filter(e => {
            return e.cat.includes('blink.user_timing') ||
                e.cat.includes('loading') ||
                e.cat.includes('devtools.timeline') ||
                e.name === 'TracingStartedInPage'
        }), (event0, event1) => event0.ts - event1.ts)

        // The first TracingStartedInPage in the trace is definitely our renderer thread of interest
        // Beware: the tracingStartedInPage event can appear slightly after a navigationStart
        const startedInPageEvt = keyEvents.find(e => e.name === 'TracingStartedInPage')
        if (!startedInPageEvt) throw new LHError(LHError.errors.NO_TRACING_STARTED)
        // Filter to just events matching the frame ID for sanity
        const frameEvents = keyEvents.filter(e => e.args.frame === startedInPageEvt.args.data.page)

        // Our navStart will be the last frame navigation in the trace
        const navigationStart = frameEvents.filter(e => e.name === 'navigationStart').pop()
        if (!navigationStart) throw new LHError(LHError.errors.NO_NAVSTART)

        // Find our first paint of this frame
        const firstPaint = frameEvents.find(e => e.name === 'firstPaint' && e.ts > navigationStart.ts)

        // FCP will follow at/after the FP
        const firstContentfulPaint = frameEvents.find(
            e => e.name === 'firstContentfulPaint' && e.ts > navigationStart.ts
        )

        // fMP will follow at/after the FP
        let firstMeaningfulPaint = frameEvents.find(
            e => e.name === 'firstMeaningfulPaint' && e.ts > navigationStart.ts
        )
        let fmpFellBack = false

        // If there was no firstMeaningfulPaint event found in the trace, the network idle detection
        // may have not been triggered before Lighthouse finished tracing.
        // In this case, we'll use the last firstMeaningfulPaintCandidate we can find.
        // However, if no candidates were found (a bogus trace, likely), we fail.
        if (!firstMeaningfulPaint) {
            const fmpCand = 'firstMeaningfulPaintCandidate'
            fmpFellBack = true
            log.info('trace-of-tab', `No firstMeaningfulPaint found, falling back to last ${fmpCand}`)
            const lastCandidate = frameEvents.filter(e => e.name === fmpCand).pop()
            if (!lastCandidate) {
                log.info('trace-of-tab', 'No `firstMeaningfulPaintCandidate` events found in trace')
            }
            firstMeaningfulPaint = lastCandidate
        }

        const load = frameEvents.find(e => e.name === 'loadEventEnd' && e.ts > navigationStart.ts)
        const domContentLoaded = frameEvents.find(
            e => e.name === 'domContentLoadedEventEnd' && e.ts > navigationStart.ts
        )

        // subset all trace events to just our tab's process (incl threads other than main)
        // stable-sort events to keep them correctly nested.
        const processEvents = stableSort(
            trace.traceEvents.filter(e => e.pid === startedInPageEvt.pid),
            (event0, event1) => event0.ts - event1.ts
        )

        const mainThreadEvents = processEvents
            .filter(e => e.tid === startedInPageEvt.tid)

        const traceEnd = trace.traceEvents.reduce((max, evt) => max.ts > evt.ts ? max : evt)

        const metrics = {
            navigationStart,
            firstPaint,
            firstContentfulPaint,
            firstMeaningfulPaint,
            traceEnd: {ts: traceEnd.ts + (traceEnd.dur || 0)},
            load,
            domContentLoaded
        }

        const timings = {}
        const timestamps = {}

        Object.keys(metrics).forEach(metric => {
            timestamps[metric] = metrics[metric] && metrics[metric].ts
            timings[metric] = (timestamps[metric] - navigationStart.ts) / 1000
        })

        return {
            timings,
            timestamps,
            processEvents,
            mainThreadEvents,
            startedInPageEvt,
            navigationStartEvt: navigationStart,
            firstPaintEvt: firstPaint,
            firstContentfulPaintEvt: firstContentfulPaint,
            firstMeaningfulPaintEvt: firstMeaningfulPaint,
            loadEvt: load,
            domContentLoadedEvt: domContentLoaded,
            fmpFellBack
        }
    }
}

module.exports = TraceOfTab

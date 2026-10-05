import React, { useEffect, useRef, useState } from 'react'
import BrowserOnly from '@docusaurus/BrowserOnly'
import { useColorMode } from '@docusaurus/theme-common'

const ORIGIN = 'https://benchmark.webdriver.io'

/**
 * The live leaderboard from benchmark.webdriver.io (`?embed=leaderboard`).
 * The frame reports its height, and follows the site's color mode.
 */
function Leaderboard ({ model }: { model?: string }) {
    const { colorMode } = useColorMode()
    const frame = useRef<HTMLIFrameElement>(null)
    const [height, setHeight] = useState(760)
    // the first color mode goes into the URL, later changes are posted, so the frame doesn't reload
    const [src] = useState(() => {
        const url = new URL('/', ORIGIN)
        url.searchParams.set('embed', 'leaderboard')
        url.searchParams.set('theme', colorMode)
        if (model) {
            url.searchParams.set('model', model)
        }
        return url.href
    })

    useEffect(() => {
        const onMessage = (e: MessageEvent) => {
            if (e.origin !== ORIGIN || e.source !== frame.current?.contentWindow || e.data?.type !== 'wdio-benchmark:height') {
                return
            }
            const next = Number(e.data.height)
            if (Number.isFinite(next) && next > 0) {
                setHeight(Math.min(Math.ceil(next), 4000))
            }
        }
        window.addEventListener('message', onMessage)
        return () => window.removeEventListener('message', onMessage)
    }, [])

    useEffect(() => {
        frame.current?.contentWindow?.postMessage({ type: 'wdio-benchmark:theme', theme: colorMode }, ORIGIN)
    }, [colorMode])

    return (
        <iframe
            ref={frame}
            src={src}
            title="Browser Agent Benchmark leaderboard"
            loading="lazy"
            style={{ width: '100%', height, border: 0, display: 'block', colorScheme: colorMode }}
        />
    )
}

export default function BenchmarkLeaderboard (props: { model?: string }) {
    return (
        <BrowserOnly fallback={<p><a href={ORIGIN}>See the leaderboard on benchmark.webdriver.io</a></p>}>
            {() => <Leaderboard {...props} />}
        </BrowserOnly>
    )
}

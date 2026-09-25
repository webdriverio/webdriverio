import React from 'react'
import useBaseUrl from '@docusaurus/useBaseUrl'

import styles from './home.module.css'

const TILE_W = 176
const TILE_H = 64
const GAP = 24
const MARGIN = 16
const CENTER = MARGIN + TILE_W + GAP + TILE_W / 2

const TILES = [
    { label: 'Browsers', detail: 'Chrome · Firefox · Safari · Edge', icon: 'browser', x: MARGIN, y: 24 },
    { label: 'Mobile', detail: 'iOS · Android · Flutter', icon: 'mobile', x: MARGIN + TILE_W + GAP, y: 24 },
    { label: 'Desktop', detail: 'macOS · Windows · Linux', icon: 'desktop', x: MARGIN + (TILE_W + GAP) * 2, y: 24 },
    { label: 'VS Code', detail: 'Extensions & editors', icon: 'editor', x: MARGIN, y: 392 },
    { label: 'Electron', detail: 'Electron · Tauri · Dioxus', icon: 'app', x: MARGIN + TILE_W + GAP, y: 392 },
    { label: 'Visual', detail: 'Pixel-perfect diffs', icon: 'visual', x: MARGIN + (TILE_W + GAP) * 2, y: 392 },
] as const

const HUB = { x: CENTER - 150, y: 186, w: 300, h: 108 }
const CYCLE = 4.2
const STAGGER = 0.45
const TRAVEL = 1.2
const ARRIVAL = (TRAVEL / CYCLE).toFixed(3)
const HIDDEN = (TRAVEL / CYCLE + 0.02).toFixed(3)

function pathFor (index: number) {
    const tile = TILES[index]
    const cx = tile.x + TILE_W / 2
    const top = index < 3
    const fromY = top ? HUB.y : HUB.y + HUB.h
    const toY = top ? tile.y + TILE_H : tile.y
    const midY = (fromY + toY) / 2
    // Mobile and Electron sit on the hub's center line. A zero-width path
    // does not paint, so those links shift by one unit and stay straight.
    if (cx === CENTER) {
        return `M${CENTER} ${fromY} L${cx + 1} ${toY}`
    }
    return `M${CENTER} ${fromY} C${CENTER} ${midY}, ${cx} ${midY}, ${cx} ${toY}`
}

function Icon ({ name }: { name: typeof TILES[number]['icon'] }) {
    const common = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
    switch (name) {
    case 'browser':
        return <g {...common}><rect x="0" y="1" width="18" height="14" rx="2.5" /><path d="M0 5h18" /><circle cx="3" cy="3" r="0.4" /><circle cx="5.2" cy="3" r="0.4" /></g>
    case 'mobile':
        return <g {...common}><rect x="4" y="0" width="10" height="17" rx="2.5" /><path d="M8 14h2" /></g>
    case 'desktop':
        return <g {...common}><rect x="0" y="1" width="18" height="11" rx="2" /><path d="M6 16h6M9 12v4" /></g>
    case 'editor':
        return <g {...common}><path d="M6 4 1 8.5 6 13M12 4l5 4.5L12 13" /></g>
    case 'app':
        return <g {...common}><ellipse cx="9" cy="8.5" rx="8" ry="3.2" /><ellipse cx="9" cy="8.5" rx="8" ry="3.2" transform="rotate(60 9 8.5)" /><ellipse cx="9" cy="8.5" rx="8" ry="3.2" transform="rotate(120 9 8.5)" /></g>
    case 'visual':
        return <g {...common}><rect x="0" y="1" width="8" height="14" rx="1.5" /><rect x="10" y="1" width="8" height="14" rx="1.5" /><path d="M12 9l2 2 3-4" /></g>
    }
}

/**
 * "One test, every platform": a command leaves the WebdriverIO runner and
 * travels to every platform it can automate, which light up as it arrives.
 */
export default function PlatformDiagram () {
    const logo = useBaseUrl('/img/logo-webdriver-io.svg')
    return (
        <svg className={styles.diagram} viewBox={`0 0 ${MARGIN * 2 + TILE_W * 3 + GAP * 2} 480`} role="img" aria-label="One WebdriverIO test running on browsers, mobile, desktop, VS Code, Electron and visual testing">
            <defs>
                <linearGradient id="wdio-line" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="var(--ifm-color-primary)" stopOpacity="0.55" />
                    <stop offset="100%" stopColor="var(--ifm-color-primary)" stopOpacity="0.15" />
                </linearGradient>
                <radialGradient id="wdio-hub-glow">
                    <stop offset="0%" stopColor="var(--ifm-color-primary)" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="var(--ifm-color-primary)" stopOpacity="0" />
                </radialGradient>
                {TILES.map((_, i) => <path key={i} id={`wdio-path-${i}`} d={pathFor(i)} />)}
            </defs>

            <ellipse cx={CENTER} cy="240" rx="220" ry="120" fill="url(#wdio-hub-glow)" className={styles.hubGlow} />

            {TILES.map((_, i) => (
                <use key={i} href={`#wdio-path-${i}`} stroke="url(#wdio-line)" strokeWidth="1.4" fill="none" strokeDasharray="3 5" className={styles.wire} />
            ))}

            <g className={styles.packets}>
                {TILES.map((_, i) => {
                    const begin = `${i * STAGGER}s`
                    return (
                        <circle key={i} r="4.5" fill="var(--ifm-color-primary)" opacity="0" className={styles.packet}>
                            <animateMotion dur={`${CYCLE}s`} begin={begin} repeatCount="indefinite" keyPoints="0;1;1" keyTimes={`0;${ARRIVAL};1`} calcMode="linear">
                                <mpath href={`#wdio-path-${i}`} />
                            </animateMotion>
                            <animate attributeName="opacity" dur={`${CYCLE}s`} begin={begin} repeatCount="indefinite" values="1;1;0;0" keyTimes={`0;${ARRIVAL};${HIDDEN};1`} />
                        </circle>
                    )
                })}
            </g>

            <g transform={`translate(${HUB.x} ${HUB.y})`}>
                <rect width={HUB.w} height={HUB.h} rx="14" className={styles.hub} />
                <image href={logo} x="16" y="16" width="26" height="26" />
                <text x="52" y="27" className={styles.hubTitle}>login.e2e.ts</text>
                <text x="52" y="40" className={styles.hubMeta}>npx wdio run</text>
                <text x="16" y="70" className={styles.hubCode}>
                    <tspan className={styles.codeKeyword}>await</tspan> $(<tspan className={styles.codeString}>'aria/Log in'</tspan>).click()
                </text>
                <text x="16" y="90" className={styles.hubCode}>
                    <tspan className={styles.codeKeyword}>await</tspan> expect($(<tspan className={styles.codeString}>'h1'</tspan>)).toHaveText(<tspan className={styles.codeString}>'Hi!'</tspan>)
                </text>
            </g>

            {TILES.map((tile, i) => (
                <g
                    key={tile.label}
                    transform={`translate(${tile.x} ${tile.y})`}
                    className={styles.tile}
                    style={{ animationDelay: `${i * STAGGER + TRAVEL}s`, animationDuration: `${CYCLE}s` } as React.CSSProperties}
                >
                    <rect width={TILE_W} height={TILE_H} rx="12" className={styles.tileBox} />
                    <g transform="translate(12 12)" className={styles.tileIcon}><Icon name={tile.icon} /></g>
                    <text x="38" y="26" className={styles.tileLabel}>{tile.label}</text>
                    <text x="12" y="50" className={styles.tileDetail}>{tile.detail}</text>
                    <g
                        transform={`translate(${TILE_W - 22} 10)`}
                        className={styles.tileCheck}
                        style={{ '--check-x': `${TILE_W - 22}px` } as React.CSSProperties}
                    >
                        <circle cx="6" cy="6" r="6" fill="#22c55e" />
                        <path d="M3.2 6.2 5.2 8.2 8.8 4.4" stroke="#fff" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                    </g>
                </g>
            ))}
        </svg>
    )
}

/**
 * Pages that bot protection shows instead of the site. Agents tend to wait,
 * reload and click "Verify you are human" on them for dozens of steps. This
 * only tells the agent what the page is and what is worth trying; the
 * session never tries to solve or get around a check.
 */
const CHECKS: { vendor: string, markers: RegExp[] }[] = [
    {
        vendor: 'Cloudflare',
        markers: [
            /^\s*- document "Just a moment\.\.\."/m,
            /iframe "Widget containing a Cloudflare security challenge"/,
            /heading "Performing security verification"/,
            /document "Attention Required! \| Cloudflare"/
        ]
    },
    { vendor: 'DataDome', markers: [/captcha-delivery\.com/, /iframe "DataDome/] },
    { vendor: 'HUMAN (PerimeterX)', markers: [/"Press & Hold"/, /Access to this page has been denied/] },
    { vendor: 'Akamai', markers: [/^\s*- document "Access Denied"/m] },
    { vendor: 'Imperva', markers: [/Incapsula incident ID/, /Request unsuccessful\. Incapsula/] },
    { vendor: 'Google', markers: [/Our systems have detected unusual traffic/] }
]

/** the bot protection vendor whose check page this snapshot shows, if any */
export function detectBotCheck (snapshot: string): string | undefined {
    return CHECKS.find(({ markers }) => markers.some((re) => re.test(snapshot)))?.vendor
}

export function botCheckNote (vendor: string, { headless, target, url, userAgent }: { headless: boolean, target: string, url?: string, userAgent?: string }) {
    const page = `This page is a ${vendor} bot check, not the site.`
    const reopen = (flags: string) => `\`wdio session open ${target}${url ? ` ${url}` : ''} ${flags} --replace\``
    if (headless && userAgent?.includes('HeadlessChrome/')) {
        // the session couldn't send a headed user agent (e.g. `--no-bidi`), and many sites refuse the headless one
        const headed = userAgent.replace('HeadlessChrome/', 'Chrome/')
        return `${page} This browser sends "HeadlessChrome" in its user agent, which many sites refuse. Reopen it with the user agent of a visible window: ${reopen(`--arg="--user-agent=${headed}"`)}, or open a visible window: ${reopen('--headed')}.`
    }
    return headless
        ? `${page} Waiting, reloading or clicking it rarely gets a headless browser through. A visible window often does: ${reopen('--headed')}.`
        : `${page} The site doesn't let this browser in; retrying rarely helps. Say so in your answer rather than trying to get past it.`
}

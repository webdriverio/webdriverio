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

export function botCheckNote (vendor: string, { headless, target, url }: { headless: boolean, target: string, url?: string }) {
    const page = `This page is a ${vendor} bot check, not the site.`
    return headless
        ? `${page} Waiting, reloading or clicking it rarely gets a headless browser through. A visible window often does: \`wdio session open ${target}${url ? ` ${url}` : ''} --headed --replace\`.`
        : `${page} The site doesn't let this browser in; retrying rarely helps. Say so in your answer rather than trying to get past it.`
}

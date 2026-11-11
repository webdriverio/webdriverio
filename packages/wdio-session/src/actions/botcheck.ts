import { cliCmd, type Cmd } from '../hints.js'

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
    // "Press & Hold" on its own page, "Press & hold to confirm you're a human" in a site's modal
    { vendor: 'HUMAN (PerimeterX)', markers: [/"Press & hold\b/i, /Access to this page has been denied/] },
    { vendor: 'Akamai', markers: [/^\s*- document "Access Denied"/m] },
    { vendor: 'Imperva', markers: [/Incapsula incident ID/, /Request unsuccessful\. Incapsula/] },
    { vendor: 'Google', markers: [/Our systems have detected unusual traffic/] }
]

/** the bot protection vendor whose check page this snapshot shows, if any */
export function detectBotCheck (snapshot: string): string | undefined {
    return CHECKS.find(({ markers }) => markers.some((re) => re.test(snapshot)))?.vendor
}

export function botCheckNote (vendor: string, { headless, target, url, userAgent }: { headless: boolean, target: string, url?: string, userAgent?: string }, cmd: Cmd = cliCmd) {
    const page = `This page is a ${vendor} bot check, not the site.`
    const reopen = (flags: string, args: Record<string, unknown>) => `\`${cmd('open', { target, ...(url ? { url } : {}), ...args, replace: true }, `wdio session open ${target}${url ? ` ${url}` : ''} ${flags} --replace`)}\``
    if (headless && userAgent?.includes('HeadlessChrome/')) {
        // the session couldn't send a headed user agent (e.g. `--no-bidi`), and many sites refuse the headless one
        const headed = userAgent.replace('HeadlessChrome/', 'Chrome/')
        return `${page} This browser sends "HeadlessChrome" in its user agent, which many sites refuse. Reopen it with the user agent of a visible window: ${reopen(`--arg="--user-agent=${headed}"`, { arg: [`--user-agent=${headed}`] })}, or open a visible window: ${reopen('--headed', { headed: true })}.`
    }
    return headless
        ? `${page} Waiting, reloading or clicking it rarely gets a headless browser through. A visible window often does: ${reopen('--headed', { headed: true })}.`
        : `${page} The site doesn't let this browser in; retrying rarely helps. Say so in your answer rather than trying to get past it.`
}

/**
 * The browser's own error page: the site never loaded (refused, reset, a
 * protocol error). Its URL is chrome-error://, and agents otherwise read it
 * as a page that is still loading and reload it for dozens of steps.
 */
export function detectLoadError (snapshot: string): string | undefined {
    const first = snapshot.split('\n', 1)[0]
    if (!/url=chrome-error:\/\//.test(first) && !/^\s*- document "[^"]*" url=about:neterror/m.test(snapshot)) {
        return undefined
    }
    const code = /\b(?:net::)?(ERR_[A-Z0-9_]+)\b/.exec(snapshot)?.[1]
    return `The page did not load: the browser shows its error page${code ? ` (${code})` : ''}. Reloading rarely helps; the site may refuse this browser. Try another page of the site or another way to the answer.`
}

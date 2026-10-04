import { describe, it, expect } from 'vitest'

import { botCheckNote, detectBotCheck, detectLoadError } from '../../src/actions/botcheck.js'

describe('detectBotCheck', () => {
    it.each([
        ['Cloudflare', '- document "Just a moment..." url=https://umich.edu/\n  - main\n    - iframe "Widget containing a Cloudflare security challenge" [ref=e4]'],
        ['Cloudflare', '- heading "umich.edu" [level=1, ref=e1]\n- heading "Performing security verification" [level=2, ref=e2]'],
        ['DataDome', '- document "zara.com" url=https://www.zara.com/\n  - iframe "DataDome CAPTCHA" [ref=e2]'],
        ['HUMAN (PerimeterX)', '- document "Access to this page has been denied"\n  - button "Press & Hold" [ref=e3]'],
        ['HUMAN (PerimeterX)', '- iframe [ref=e8]\n    - text "Quick verification"\n    - text "Press & hold to confirm you\'re a human (and not a bot)."'],
        ['Akamai', '- document "Access Denied" url=https://www.example.com/\n  - heading "Access Denied"'],
        ['Google', '- document "https://www.google.com/sorry/index"\n  - text "Our systems have detected unusual traffic from your computer network."']
    ])('recognizes a %s check', (vendor, snapshot) => {
        expect(detectBotCheck(snapshot)).toBe(vendor)
    })

    it('leaves ordinary pages alone', () => {
        expect(detectBotCheck('- document "University of Michigan" url=https://umich.edu/\n  - link "Giving" [ref=e19]')).toBeUndefined()
        // a page that only mentions the words, not a document titled like a check
        expect(detectBotCheck('- document "Blog"\n  - paragraph "Just a moment... then the page loads"')).toBeUndefined()
    })
})

describe('botCheckNote', () => {
    it('suggests a visible window for a headless session', () => {
        const note = botCheckNote('Cloudflare', { headless: true, target: 'chrome', url: 'https://umich.edu/' })
        expect(note).toContain('Cloudflare bot check')
        expect(note).toContain('`wdio session open chrome https://umich.edu/ --headed --replace`')
    })

    it('suggests the user agent of a visible window when the session still sends the headless one', () => {
        const userAgent = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/154.0.0.0 Safari/537.36'
        const note = botCheckNote('Akamai', { headless: true, target: 'chrome', url: 'https://www.zara.com/us/', userAgent })
        expect(note).toContain('"HeadlessChrome"')
        expect(note).toContain('`wdio session open chrome https://www.zara.com/us/ --arg="--user-agent=Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36" --replace`')
        expect(note).toContain('--headed --replace')
    })

    it('says to report it when the window is already visible', () => {
        const note = botCheckNote('Akamai', { headless: false, target: 'chrome' })
        expect(note).not.toContain('--headed')
        expect(note).toContain('Say so in your answer')
    })
})

describe('detectLoadError', () => {
    it('names the browser error page and its error code', () => {
        const page = '- document "www.bestbuy.com" url=chrome-error://chromewebdata/\n  - heading "This site can’t be reached"\n  - text "ERR_QUIC_PROTOCOL_ERROR"'
        expect(detectLoadError(page)).toBe('The page did not load: the browser shows its error page (ERR_QUIC_PROTOCOL_ERROR). Reloading rarely helps; the site may refuse this browser. Try another page of the site or another way to the answer.')
    })

    it('leaves pages that loaded alone', () => {
        expect(detectLoadError('- document "Shop" url=https://shop.test/\n  - heading "chrome-error://"')).toBeUndefined()
    })
})

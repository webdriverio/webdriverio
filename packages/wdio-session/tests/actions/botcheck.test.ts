import { describe, it, expect } from 'vitest'

import { botCheckNote, detectBotCheck } from '../../src/actions/botcheck.js'

describe('detectBotCheck', () => {
    it.each([
        ['Cloudflare', '- document "Just a moment..." url=https://umich.edu/\n  - main\n    - iframe "Widget containing a Cloudflare security challenge" [ref=e4]'],
        ['Cloudflare', '- heading "umich.edu" [level=1, ref=e1]\n- heading "Performing security verification" [level=2, ref=e2]'],
        ['DataDome', '- document "zara.com" url=https://www.zara.com/\n  - iframe "DataDome CAPTCHA" [ref=e2]'],
        ['HUMAN (PerimeterX)', '- document "Access to this page has been denied"\n  - button "Press & Hold" [ref=e3]'],
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

    it('says to report it when the window is already visible', () => {
        const note = botCheckNote('Akamai', { headless: false, target: 'chrome' })
        expect(note).not.toContain('--headed')
        expect(note).toContain('Say so in your answer')
    })
})

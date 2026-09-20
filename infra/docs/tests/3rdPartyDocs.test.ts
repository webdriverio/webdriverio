import { describe, it, expect } from 'vitest'

import { normalizeDoc, buildInfo, docsFixes } from '../src/3rdPartyDocs.js'

describe('buildInfo', () => {
    it('renders a 3rd-party attribution line', () => {
        expect(buildInfo('wdio-video-reporter', 'https://github.com/example/video', 'https://npmjs.com/wdio-video-reporter'))
            .toEqual([
                '> wdio-video-reporter is a 3rd party package, for more information please see [GitHub](https://github.com/example/video) | [npm](https://npmjs.com/wdio-video-reporter)'
            ])
    })
})

describe('normalizeDoc', () => {
    it('strips the title, badges, and promotes headings one level', () => {
        const readme = [
            '# Video Reporter',
            '[![ci](https://badge.fury.io/js/wdio-video-reporter.svg)](https://npmjs.com)',
            '',
            '## Usage',
            'See [guide](docs/guide.md) and [site](https://example.com) and [anchor](#usage).',
            '<img src="logo.png">'
        ].join('\n')

        const result = normalizeDoc(
            readme,
            'https://github.com/example/video',
            'main',
            ['---', 'id: video', '---'],
            ['> info'],
            'wdio-video-reporter'
        )

        expect(result).toContain('id: video')
        expect(result).toContain('> info')
        expect(result).not.toContain('# Video Reporter')
        expect(result).not.toContain('badge.fury.io')
        expect(result).toContain('### Usage')
        expect(result).toContain('https://github.com/example/video/blob/main/docs/guide.md')
        expect(result).toContain('https://example.com')
        expect(result).toContain('#usage')
        expect(result).toContain('<img src="logo.png" />')
    })

    it('applies package-specific README fixes', () => {
        const raw = 'Visit <http://reportportal.io/> for more'
        expect(docsFixes['wdio-reportportal-reporter'](raw))
            .toBe('Visit [http://reportportal.io/](http://reportportal.io/) for more')
    })
})

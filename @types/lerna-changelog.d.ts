// import { Changelog } from ''
// import { load } from 'lerna-changelog/lib/configuration.js'

declare module 'lerna-changelog' {
    class Changelog {
        constructor(options: any)
        createMarkdown: (options: { tagFrom: string }) => Promise<string>
    }
}

declare module 'lerna-changelog/lib/configuration.js' {
    var load: (options: { nextVersionFromMetadata: boolean }) => any
}

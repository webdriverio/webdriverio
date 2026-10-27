import fs from 'node:fs/promises'
import { polyfillPath } from 'modern-node-polyfills'
import type { Plugin, PluginBuild } from 'esbuild'

/**
 * Vite plugins do not run when dependencies are pre-bundled, so `path` there
 * is Vite's empty browser stub. jest-message-util >= 30.5 (used by `expect`)
 * calls `path.resolve()` when it loads, so give it the real polyfill.
 */
export function pathPolyfill () {
    return <Plugin>{
        name: 'wdio:pathPolyfill',
        setup (build: PluginBuild) {
            build.onResolve(
                { filter: /^(node:)?path$/ },
                async () => ({ path: await polyfillPath('path') })
            )
        }
    }
}

export function codeFrameFix () {
    return <Plugin>{
        name: 'wdio:codeFrameFix',
        setup (build: PluginBuild) {
            build.onLoad(
                { filter: /@babel\/code-frame/, namespace: 'file' },

                /**
                 * mock @babel/code-frame as it fails in Safari due
                 * to usage of chalk
                 */
                async ({ path: id }: { path: string }) => {
                    const code = await fs.readFile(id).then(
                        (buf) => buf.toString(),
                        () => undefined)

                    if (!code) {
                        return
                    }

                    return {
                        contents: code.replace('require("@babel/highlight");', /*js*/`{
                            shouldHighlight: false,
                            reset: () => {}
                        }`)
                    }
                }
            )
        }
    }
}

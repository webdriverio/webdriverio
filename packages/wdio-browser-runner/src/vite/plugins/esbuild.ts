import fs from 'node:fs/promises'
import type { Plugin, PluginBuild } from 'esbuild'

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

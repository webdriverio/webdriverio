import path from 'node:path'

import { builtinModules } from 'node:module'
import esbuild from 'rollup-plugin-esbuild'
import dts from 'rollup-plugin-dts'

/**
 * return the basic rollup config for a WebdriverIO package
 * @param {string} pkgDir root dir of the package
 * @param {*} pkg         package.json of the package
 * @returns a rollup config
 */
export function getRollupConfig(pkgDir, pkg, opts = {}) {
    const external = [
        ...builtinModules,
        ...builtinModules.map((mod) => `node:${mod}`),
        ...Object.keys(pkg.dependencies || {}),
        ...Object.keys(pkg.peerDependencies || {}),
    ]

    /** @type {import('rollup').RollupOptions} */
    const typeConfig = {
        input: path.resolve(pkgDir, 'src', 'index.ts'),
        output: {
            dir: path.resolve(pkgDir, 'build'),
            format: 'es'
        },
        external,
        plugins: [dts({ respectExternal: true })],
        onwarn,
    }

    /** @type {import('rollup').RollupOptions[]} */
    const builds = [typeConfig]

    /**
     * only build esm if there is an exports field in package.json
     */
    if (pkg.exports) {
        /** @type {import('rollup').RollupOptions} */
        const esmConfig = {
            input: path.resolve(pkgDir, 'src', 'index.ts'),
            output: {
                dir: path.resolve(pkgDir, 'build'),
                format: 'es'
            },
            external,
            plugins: [esbuild({ target: 'node18' }), ...(opts.esm?.plugins || [])],
            onwarn,
        }
        builds.unshift(esmConfig)
    }

    /**
     * only build cjs if there is a main field in package.json
     */
    if (typeof pkg.main === 'string') {
        /** @type {import('rollup').RollupOptions} */
        const cjsConfig = {
            input: path.resolve(pkgDir, 'src', 'index.ts'),
            output: {
                file: path.resolve(pkgDir, 'build', 'index.cjs.js'),
                format: 'cjs'
            },
            external,
            plugins: [esbuild({ target: 'node18' }), ...(opts.cjs?.plugins || [])],
            onwarn,
        }

        builds.push(cjsConfig)
    }

    /**
     * create a browser optimized build if there is a browser field in package.json
     */
    if (typeof pkg.browser === 'string') {
        /** @type {import('rollup').RollupOptions} */
        const browserConfig = {
            input: path.resolve(pkgDir, 'src', 'browser.ts'),
            output: {
                file: path.resolve(pkgDir, 'build', 'browser.js'),
                format: 'es'
            },
            external,
            plugins: [
                esbuild({ target: ['es2020', 'chrome58', 'edge16', 'firefox57', 'safari11'] }),
                ...(opts.browser?.plugins || [])
            ],
            onwarn,
        }

        builds.push(browserConfig)
    }

    return builds
}

function onwarn(message) {
    if (['EMPTY_BUNDLE', 'CIRCULAR_DEPENDENCY', 'EVAL'].includes(message.code)) {
        return
    }
    console.error(message)
}

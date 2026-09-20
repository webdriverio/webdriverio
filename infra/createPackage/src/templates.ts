export const PACKAGE_TYPES = ['reporter', 'service', 'runner', 'framework'] as const
export type PackageType = typeof PACKAGE_TYPES[number]

export interface PackageScaffold {
    fullPackageName: string
    fullScopedPackageName: string
    mainPackageFolderFiles: { name: string, content: string }[]
    srcPackageFolderFiles: { name: string, content: string }[]
    testsPackageFolderFiles: { name: string, content: string }[]
}

export function getPackageNames(packageName: string, packageType: PackageType) {
    return {
        fullPackageName: `wdio-${packageName}-${packageType}`,
        fullScopedPackageName: `@wdio/${packageName}-${packageType}`
    }
}

export function buildPackageScaffold(packageName: string, packageType: PackageType): PackageScaffold {
    const { fullPackageName, fullScopedPackageName } = getPackageNames(packageName, packageType)

    return {
        fullPackageName,
        fullScopedPackageName,
        mainPackageFolderFiles: [{
            name: '.npmignore',
            content: 'src\ntests\ntsconfig.json\ntsconfig.prod.json'
        }, {
            name: 'tsconfig.json',
            content: `{
    "extends": "../../tsconfig",
    "compilerOptions": {
        "baseUrl": ".",
        "outDir": "./build",
        "rootDir": "./src"
    },
    "include": [
        "src/**/*"
    ]
}`
        }, {
            name: 'tsconfig.prod.json',
            content: `{
    "extends": "../../tsconfig.prod",
    "compilerOptions": {
        "baseUrl": ".",
        "outDir": "./build",
        "rootDir": "./src"
    },
    "include": [
        "src/**/*"
    ]
}`
        }, {
            name: 'package.json',
            content: `{
  "name": "${fullScopedPackageName}",
  "version": "0.0.0",
  "description": "A WebdriverIO ${packageType} that <provide ${packageType} description>",
  "author": "<your-name> <your@email.com>",
  "homepage": "https://github.com/webdriverio/webdriverio/tree/main/packages/${fullPackageName}",
  "license": "MIT",
  "type": "module",
  "exports": "./build/index.js",
  "types": "./build/index.d.ts",
  "typeScriptVersion": "3.8.3",
  "engines": {
    "node": ">=18.20.0"
  },
  "repository": {
    "type": "git",
    "url": "git+https://github.com/webdriverio/webdriverio.git"
  },
  "keywords": [
    "webdriver",
    "wdio",
    "wdio-${packageType}"
  ],
  "bugs": {
    "url": "https://github.com/webdriverio/webdriverio/issues"
  },
  "dependencies": {
  },
  "publishConfig": {
    "access": "public"
  }
}`
        }, {
            name: 'README.md',
            content: `WebdriverIO ${packageName.toUpperCase()} ${packageType.charAt(0).toUpperCase()}${packageType.substr(1)}\n========================`
        }],
        srcPackageFolderFiles: [{
            name: 'index.js',
            content: 'export default {}'
        }],
        testsPackageFolderFiles: [{
            name: 'example.test.ts',
            content: `import { describe, it, expect } from 'vitest'
describe('Unit test example', () => {
    it('Test #1', () => {
        expect(1).toBe(1)
    })
})`
        }]
    }
}

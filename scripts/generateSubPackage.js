#!/usr/bin/env node
/**
 * This script generates new sub package with initial structure and files
 */

import fs from 'node:fs'
import url from 'node:url'
import path from 'node:path'
import shell from 'shelljs'
import inquirer from 'inquirer'

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))

const questions = [{
    type: 'list',
    name: 'packageType',
    message: 'Select sub package type:',
    choices: ['reporter', 'service', 'runner', 'framework'],
    default: 'reporter'
}, {
    type: 'input',
    name: 'packageName',
    message: 'Provide sub package name:'
}]

const { packageName, packageType } = await inquirer.prompt(questions)
const packagesDir = path.join(__dirname, '..', 'packages')
const fullPackageName = `wdio-${packageName}-${packageType}`
const fullScopedPackageName = `@wdio/${packageName}-${packageType}`

const mainPackageFolder = path.join(packagesDir, fullPackageName)
const mainPackageFolderFiles = [{
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
  "main": "./build/index.cjs.js",
  "type": "module",
  "module": "./build/index.js",
  "exports": {
    ".": [
      {
        "import": "./build/index.js",
        "require": "./build/index.cjs.js"
      },
      "./build/index.cjs.js"
    ]
  },
  "types": "./build/index.d.ts",
  "typeScriptVersion": "3.8.3",
  "engines": {
    "node": ">=12.0.0"
  },
  "repository": {
    "type": "git",
    "url": "git://github.com/webdriverio/webdriverio.git"
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
}]

const srcPackageFolder = path.join(mainPackageFolder, 'src')
const srcPackageFolderFiles = [{
    name: 'index.js',
    content: 'export default {}'
}]

const testsPackageFolder = path.join(mainPackageFolder, 'tests')
const testsPackageFolderFiles = [{
    name: 'example.test.ts',
    content: `import { describe, it, expect } from 'vitest'
describe('Unit test example', () => {
    it('Test #1', () => {
        expect(1).toBe(1)
    })
})`
}]

const existingPackages = fs.readdirSync(packagesDir)
    .map(name => path.join(packagesDir, name))
    .filter(source => fs.lstatSync(source).isDirectory())

const createFile = (file, content) => {
    shell.touch(file)
    shell.ShellString(content).to(file)
}

if (packageName === '') {
    throw new Error('Package name can not be empty')
}

if (existingPackages.includes(mainPackageFolder)) {
    throw new Error(`Package '${fullPackageName}' already exists. Please choose another name.`)
}

// create package structure
[mainPackageFolder, srcPackageFolder, testsPackageFolder].map(folder => shell.mkdir(folder))

// create main folder files
mainPackageFolderFiles.map(file => createFile(path.join(mainPackageFolder, file.name), file.content))

// create src folder files
srcPackageFolderFiles.map(file => createFile(path.join(srcPackageFolder, file.name), file.content))

// create tests folder files
testsPackageFolderFiles.map(file => createFile(path.join(testsPackageFolder, file.name), file.content))

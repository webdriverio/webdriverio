#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const { buildCommand } = require('./generate-typings-utils')
const dox = require('dox')

const gatherCommands = (commandPath) => {
    const commandContents = fs.readFileSync(commandPath).toString()
    const commandDocs = dox.parseComments(commandContents)
    const commands = []

    commandDocs.forEach(command => {
        if (command.tags) {
            const nameTag = command.tags.find(tag => tag.type === 'name')
            if (nameTag && nameTag.string) {
                commands.push(buildCommand(`function ${nameTag.string}`, command.tags))
            } else {
                throw new Error('Missing name tag for command. \n' + command.code)
            }
        }
    })

    return commands
}

const allureCommands = gatherCommands(path.join(__dirname + '/../../packages/wdio-allure-reporter/src/index.js'))

const templatePath = path.join(__dirname, '../templates', 'allure-reporter.tpl.d.ts')
const templateContents = fs.readFileSync(templatePath, 'utf8')

let typingsContents = templateContents.replace('// ... AllureReporter commands ...', `${allureCommands.join(';\n    ')};`)

const outputFile = path.join(__dirname, '..', '..', 'packages/wdio-allure-reporter', 'allure-reporter.d.ts')
fs.writeFileSync(outputFile, typingsContents, { encoding: 'utf-8' })

// eslint-disable-next-line no-console
console.log(`Generated typings file at ${outputFile}`)

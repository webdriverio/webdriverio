import { fileURLToPath } from 'node:url'
import { config as base } from './wdio.conf.js'

export const config = {
    ...base,
    specs: [fileURLToPath(new URL('./nodeElementCommands.test.js', import.meta.url))],
    async before (...args) {
        await base.before?.apply(this, args)
        browser.addCommand('ownedBrowserCommand', function (argument) {
            return { marker: 'node-browser-command', argument }
        })
        browser.addCommand('ownedElementCommand', async function (argument) {
            return {
                marker: 'node-element-command', elementId: this.elementId,
                tagName: await this.getTagName(), text: await this.getText(), argument
            }
        }, { attachToElement: true })
        browser.addCommand('ownedSharedCommand', function (argument) {
            return `browser:${argument}`
        })
        browser.addCommand('ownedSharedCommand', function (argument) {
            return `element:${this.elementId}:${argument}`
        }, { attachToElement: true })
        browser.addCommand('ownedElementFailure', function () {
            const error = new Error('owned element command failure')
            error.name = 'OwnedCommandError'
            throw error
        }, { attachToElement: true })
    }
}

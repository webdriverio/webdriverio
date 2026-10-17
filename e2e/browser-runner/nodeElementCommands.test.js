import { $, browser, expect } from '@wdio/globals'
import { renderCommandTargets } from './components/NodeCommandTarget.js'

describe('Node-registered custom commands', () => {
    beforeEach(() => {
        renderCommandTargets()
    })

    it('runs a Node-registered browser command with its argument', async () => {
        expect(await browser.ownedBrowserCommand('browser-argument')).toEqual({
            marker: 'node-browser-command', argument: 'browser-argument'
        })
    })

    it('runs native element commands on the owned element', async () => {
        const element = await $('#owned-command-target')
        expect(await element.getTagName()).toBe('button')
        expect(await element.getText()).toBe('Owned element text')
    })

    it('runs a Node-registered element command with its element receiver and argument', async () => {
        const element = await $('#owned-command-target')
        expect(typeof browser.ownedElementCommand).toBe('undefined')
        expect(typeof element.ownedBrowserCommand).toBe('undefined')
        const result = await element.ownedElementCommand('element-argument')
        expect(result).toEqual({
            marker: 'node-element-command', elementId: element.elementId, tagName: 'button',
            text: 'Owned element text', argument: 'element-argument'
        })
    })

    it('keeps same-name browser and element commands in their own scopes', async () => {
        const element = await $('#owned-command-target')
        expect(await browser.ownedSharedCommand('browser')).toBe('browser:browser')
        expect(await element.ownedSharedCommand('element')).toBe(`element:${element.elementId}:element`)
    })

    it('uses the receiver of each element call', async () => {
        const element = await $('#owned-second-target')
        expect(await element.ownedElementCommand('second-argument')).toEqual({
            marker: 'node-element-command', elementId: element.elementId, tagName: 'span',
            text: 'Second element text', argument: 'second-argument'
        })
    })

    it('returns a custom element command failure to the caller', async () => {
        const element = await $('#owned-command-target')
        await expect(element.ownedElementFailure()).rejects.toMatchObject({ name: 'OwnedCommandError', message: 'owned element command failure' })
    })

    it('rejects an element command without an element id instead of using browser scope', async () => {
        const command = browser.__propertiesObject__.ownedElementCommand.value
        await expect(command.call({ options: {} }, 'unused')).rejects.toThrow('Cannot execute custom command "ownedElementCommand" without an element id')
    })
})

import { describe, it, expect } from 'vitest'

import { findNodes, getNodeText, getNodeValue, isSupportedStrategy, type TreeNode } from '../src/tree.js'
import { ANDROID_TREE, IOS_TREE } from './__fixtures__/trees.js'

const refs = (...args: Parameters<typeof findNodes>) => findNodes(...args).map((node) => node.ref)

describe('isSupportedStrategy', () => {
    it('knows the strategies that can be matched in the tree', () => {
        expect(isSupportedStrategy('accessibility id')).toBe(true)
        expect(isSupportedStrategy('id')).toBe(true)
        expect(isSupportedStrategy('class name')).toBe(true)
        expect(isSupportedStrategy('xpath')).toBe(false)
        expect(isSupportedStrategy('css selector')).toBe(false)
        expect(isSupportedStrategy('-ios predicate string')).toBe(false)
    })
})

describe('findNodes on iOS', () => {
    it('finds by accessibility id: the identifier', () => {
        expect(refs(IOS_TREE, 'ios', 'accessibility id', 'com.apple.settings.general')).toEqual(['@e4'])
    })

    it('finds by accessibility id: the label of an element without an identifier', () => {
        expect(refs(IOS_TREE, 'ios', 'accessibility id', 'Accessibility')).toEqual(['@e8'])
    })

    it('does not find an element with an identifier by its label, the same as Appium', () => {
        expect(refs(IOS_TREE, 'ios', 'accessibility id', 'General')).toEqual(['@e5'])
    })

    it('finds a label if mobilecli sends no name', () => {
        const tree = [{ type: 'Button', label: 'Continue', ref: '@e1', rect: { x: 0, y: 0, width: 10, height: 10 } }]
        expect(refs(tree, 'ios', 'accessibility id', 'Continue')).toEqual(['@e1'])
    })

    it('finds by id the same as by accessibility id', () => {
        expect(refs(IOS_TREE, 'ios', 'id', 'com.apple.settings.general')).toEqual(['@e4'])
    })

    it('finds by class name, with and without XCUIElementType', () => {
        expect(refs(IOS_TREE, 'ios', 'class name', 'XCUIElementTypeButton')).toEqual(['@e4', '@e7'])
        expect(refs(IOS_TREE, 'ios', 'class name', 'Button')).toEqual(['@e4', '@e7'])
    })

    it('returns the elements in the order of the dump, a parent before its children', () => {
        expect(refs(IOS_TREE, 'ios', 'accessibility id', 'Settings')).toEqual(['@e1', '@e2'])
        expect(refs(IOS_TREE, 'ios', 'class name', 'XCUIElementTypeStaticText')).toEqual(['@e2', '@e5', '@e8'])
    })

    it('searches below the given elements only', () => {
        const general = findNodes(IOS_TREE, 'ios', 'accessibility id', 'com.apple.settings.general')[0]
        expect(refs(general.children!, 'ios', 'accessibility id', 'chevron.forward')).toEqual(['@e6'])
    })

    it('returns nothing if no element matches', () => {
        expect(refs(IOS_TREE, 'ios', 'accessibility id', 'nope')).toEqual([])
        expect(refs([], 'ios', 'accessibility id', 'Settings')).toEqual([])
    })
})

describe('findNodes on Android', () => {
    it('finds by accessibility id: the content-desc', () => {
        expect(refs(ANDROID_TREE, 'android', 'accessibility id', 'login')).toEqual(['@e5'])
    })

    it('does not match the resource id or the text by accessibility id', () => {
        expect(refs(ANDROID_TREE, 'android', 'accessibility id', 'com.example.app:id/title')).toEqual([])
        expect(refs(ANDROID_TREE, 'android', 'accessibility id', 'Login')).toEqual([])
    })

    it('finds by id: the whole resource id or its name', () => {
        expect(refs(ANDROID_TREE, 'android', 'id', 'com.example.app:id/username')).toEqual(['@e3'])
        expect(refs(ANDROID_TREE, 'android', 'id', 'username')).toEqual(['@e3'])
        expect(refs(ANDROID_TREE, 'android', 'id', 'content')).toEqual(['@e1'])
        expect(refs(ANDROID_TREE, 'android', 'id', 'name')).toEqual([])
    })

    it('finds by class name: the whole class', () => {
        expect(refs(ANDROID_TREE, 'android', 'class name', 'android.widget.EditText')).toEqual(['@e3', '@e4'])
        expect(refs(ANDROID_TREE, 'android', 'class name', 'android.widget.TextView')).toEqual(['@e2', '@e6'])
        expect(refs(ANDROID_TREE, 'android', 'class name', 'EditText')).toEqual([])
    })
})

const rect = { x: 10, y: 20, width: 100, height: 40 }
const node = (fields: Partial<TreeNode>): TreeNode => ({ type: 'Other', rect, ...fields })

describe('getNodeText', () => {
    it('is the text, else the label, else the value, as in Mobilewright', () => {
        expect(getNodeText(node({ text: 'Log in', label: 'button-LOGIN', value: 'x' }))).toBe('Log in')
        expect(getNodeText(node({ type: 'StaticText', label: 'You are logged in!', name: 'You are logged in!' }))).toBe('You are logged in!')
        expect(getNodeText(node({ type: 'TextField', value: 'Hello' }))).toBe('Hello')
        expect(getNodeText(node({ type: 'Switch', value: '1', label: 'Wi-Fi' }))).toBe('Wi-Fi')
    })

    it('skips a field that is empty', () => {
        expect(getNodeText(node({ text: '', label: 'input-email', placeholder: 'Email' }))).toBe('input-email')
        expect(getNodeText(node({ text: '', label: '', value: '50.0' }))).toBe('50.0')
    })

    it('is not the placeholder or the identifier', () => {
        expect(getNodeText(node({ type: 'TextField', name: 'text-input', identifier: 'text-input', placeholder: 'Type something' }))).toBe('')
    })
})

describe('getNodeValue', () => {
    it('is the value, not the text or the label', () => {
        expect(getNodeValue(node({ type: 'TextField', value: 'Hello', label: 'Name' }))).toBe('Hello')
        expect(getNodeValue(node({ type: 'android.widget.EditText', text: 'a@b.c', value: 'a@b.c', label: 'input-email' }))).toBe('a@b.c')
    })

    it('is an empty string for an element without a value', () => {
        expect(getNodeValue(node({ type: 'StaticText', label: 'Name', text: 'Name' }))).toBe('')
    })
})

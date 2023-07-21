import { expect, test } from 'vitest'
import { isEmuSim, isRDC } from '../src/utils.js'

test('isRDC should be false for no provided deviceName and platformName', () => {
    expect(isRDC({})).toEqual(false)
})

test('isRDC should be false for a non matching deviceName', () => {
    expect(isRDC({ deviceName: 'foo' })).toEqual(false)
})

test('isRDC should be false for a non matching W3C deviceName', () => {
    expect(isRDC({ 'appium:deviceName': 'foo' })).toEqual(false)
})

test('isRDC should be false for a non matching platformName', () => {
    expect(isRDC({ platformName: 'foo' })).toEqual(false)
})

test('isRDC should be false for an emulator test', () => {
    expect(isRDC({ deviceName: 'Google Pixel emulator', platformName: 'Android' })).toEqual(false)
})

test('isRDC should be false for an W3C emulator test', () => {
    expect(isRDC({ 'appium:deviceName': 'Google Pixel emulator', platformName: 'Android' })).toEqual(false)
})

test('isRDC should be false for a simulator test', () => {
    expect(isRDC({ deviceName: 'iPhone XS simulator', platformName: 'iOS' })).toEqual(false)
})

test('isRDC should be false for a W3C simulator test', () => {
    expect(isRDC({ 'appium:deviceName': 'iPhone XS simulator', platformName: 'iOS' })).toEqual(false)
})

test('isRDC should be true for a real device iOS test', () => {
    expect(isRDC({ deviceName: 'iPhone XS', platformName: 'iOS' })).toEqual(true)
})

test('isRDC should be true for a W3C real device iOS test', () => {
    expect(isRDC({ 'appium:deviceName': 'iPhone XS', platformName: 'iOS' })).toEqual(true)
})

test('isRDC should be true for real device Android test', () => {
    expect(isRDC({ deviceName: 'Google Pixel', platformName: 'Android' })).toEqual(true)
})

test('isRDC should be true for a W3C real device Android test', () => {
    expect(isRDC({ 'appium:deviceName': 'Google Pixel', platformName: 'Android' })).toEqual(true)
})

test('isEmuSim should be false for no provided deviceName and platformName', () => {
    expect(isEmuSim({})).toEqual(false)
})

test('isEmuSim should be false for a non matching deviceName', () => {
    expect(isEmuSim({ deviceName: 'foo' })).toEqual(false)
})

test('isEmuSim should be false for a non matching W3C deviceName', () => {
    expect(isEmuSim({ 'appium:deviceName': 'foo' })).toEqual(false)
})

test('isEmuSim should be false for a non matching platformName', () => {
    expect(isEmuSim({ platformName: 'foo' })).toEqual(false)
})

test('isEmuSim should be true for an emulator test', () => {
    expect(isEmuSim({ deviceName: 'Google Pixel emulator', platformName: 'Android' })).toEqual(true)
})

test('isEmuSim should be true for a W3C emulator test', () => {
    expect(isEmuSim({ 'appium:deviceName': 'Google Pixel emulator', platformName: 'Android' })).toEqual(true)
})

test('isEmuSim should be true for a W3C simulator test', () => {
    expect(isEmuSim({ 'appium:deviceName': 'iPhone XS simulator', platformName: 'iOS' })).toEqual(true)
})

test('isEmuSim should be false for a real device iOS test', () => {
    expect(isEmuSim({ deviceName: 'iPhone XS', platformName: 'iOS' })).toEqual(false)
})

test('isEmuSim should be false for a W3C real device iOS test', () => {
    expect(isEmuSim({ 'appium:deviceName': 'iPhone XS', platformName: 'iOS' })).toEqual(false)
})

test('isEmuSim should be false for real device Android test', () => {
    expect(isEmuSim({ deviceName: 'Google Pixel', platformName: 'Android' })).toEqual(false)
})

test('isEmuSim should be false for a W3C real device Android test', () => {
    expect(isEmuSim({ 'appium:deviceName': 'Google Pixel', platformName: 'Android' })).toEqual(false)
})

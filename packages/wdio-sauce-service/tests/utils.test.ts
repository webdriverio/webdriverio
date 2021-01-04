import { isEmuSim, isUnifiedPlatform } from '../src/utils'

test('isUnifiedPlatform should be false for no provided deviceName and platformName', () => {
    expect(isUnifiedPlatform({})).toEqual(false)
})

test('isUnifiedPlatform should be false for a non matching deviceName', () => {
    expect(isUnifiedPlatform({ deviceName: 'foo' })).toEqual(false)
})

test('isUnifiedPlatform should be false for a non matching W3C deviceName', () => {
    expect(isUnifiedPlatform({ 'appium:deviceName': 'foo' })).toEqual(false)
})

test('isUnifiedPlatform should be false for a non matching platformName', () => {
    expect(isUnifiedPlatform({ platformName: 'foo' })).toEqual(false)
})

test('isUnifiedPlatform should be false for an emulator test', () => {
    expect(isUnifiedPlatform({ deviceName: 'Google Pixel emulator', platformName: 'Android' })).toEqual(false)
})

test('isUnifiedPlatform should be false for an W3C emulator test', () => {
    expect(isUnifiedPlatform({ 'appium:deviceName': 'Google Pixel emulator', platformName: 'Android' })).toEqual(false)
})

test('isUnifiedPlatform should be false for a simulator test', () => {
    expect(isUnifiedPlatform({ deviceName: 'iPhone XS simulator', platformName: 'iOS' })).toEqual(false)
})

test('isUnifiedPlatform should be false for a W3C simulator test', () => {
    expect(isUnifiedPlatform({ 'appium:deviceName': 'iPhone XS simulator', platformName: 'iOS' })).toEqual(false)
})

test('isUnifiedPlatform should be true for a real device iOS test', () => {
    expect(isUnifiedPlatform({ deviceName: 'iPhone XS', platformName: 'iOS' })).toEqual(true)
})

test('isUnifiedPlatform should be true for a W3C real device iOS test', () => {
    expect(isUnifiedPlatform({ 'appium:deviceName': 'iPhone XS', platformName: 'iOS' })).toEqual(true)
})

test('isUnifiedPlatform should be true for real device Android test', () => {
    expect(isUnifiedPlatform({ deviceName: 'Google Pixel', platformName: 'Android' })).toEqual(true)
})

test('isUnifiedPlatform should be true for a W3C real device Android test', () => {
    expect(isUnifiedPlatform({ 'appium:deviceName': 'Google Pixel', platformName: 'Android' })).toEqual(true)
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

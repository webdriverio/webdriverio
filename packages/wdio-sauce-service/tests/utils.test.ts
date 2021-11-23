import { isRDC } from '../src/utils'

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

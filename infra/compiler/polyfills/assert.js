// Minimal assert polyfill
function assert(value, message) {
    if (!value) {
        throw new Error(message || 'Assertion failed')
    }
}

assert.equal = function (actual, expected, message) {
    // eslint-disable-next-line eqeqeq
    if (actual != expected) {
        throw new Error(message || `Expected ${actual} to equal ${expected}`)
    }
}

assert.strictEqual = function (actual, expected, message) {
    if (actual !== expected) {
        throw new Error(message || `Expected ${actual} to strictly equal ${expected}`)
    }
}

assert.deepEqual = function (actual, expected, message) {
    // Basic shallow check for now, sufficient for most simple asserts
    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
        throw new Error(message || `Expected ${JSON.stringify(actual)} to deep equal ${JSON.stringify(expected)}`)
    }
}

assert.ok = assert
assert.match = function (string, regexp, message) {
    if (!regexp.test(string)) {
        throw new Error(message || `Expected ${string} to match ${regexp}`)
    }
}

export default assert

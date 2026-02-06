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
    function deepEqual(a, b, seen = new WeakSet()) {
        // Strict equality check
        if (a === b) {
            return true
        }

        // Null/undefined checks
        if (a === null || b === null) {
            return a === b
        }

        // Type check
        if (typeof a !== typeof b) {
            return false
        }

        // Primitive types
        if (typeof a !== 'object') {
            return a === b
        }

        // Circular reference check
        if (seen.has(a)) {
            return true
        }
        seen.add(a)

        // Array check
        if (Array.isArray(a) !== Array.isArray(b)) {
            return false
        }
        if (Array.isArray(a)) {
            if (a.length !== b.length) {
                return false
            }
            return a.every((val, idx) => deepEqual(val, b[idx], seen))
        }

        // Object comparison
        const keysA = Object.keys(a).sort()
        const keysB = Object.keys(b).sort()

        if (keysA.length !== keysB.length) {
            return false
        }
        if (!keysA.every((key, idx) => key === keysB[idx])) {
            return false
        }

        return keysA.every(key => deepEqual(a[key], b[key], seen))
    }

    if (!deepEqual(actual, expected)) {
        const actualStr = typeof actual === 'object' ? JSON.stringify(actual, null, 2) : String(actual)
        const expectedStr = typeof expected === 'object' ? JSON.stringify(expected, null, 2) : String(expected)
        throw new Error(message || `Expected ${actualStr} to deep equal ${expectedStr}`)
    }
}

assert.ok = assert
assert.match = function (string, regexp, message) {
    if (!regexp.test(string)) {
        throw new Error(message || `Expected ${string} to match ${regexp}`)
    }
}

export default assert

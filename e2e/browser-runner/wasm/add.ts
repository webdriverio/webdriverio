/**
 * This exports an add function.
 * It takes in two 32-bit integer values
 * And returns a 32-bit integer value.
 *
 * You can compile this via:
 *
 *   npm install -g assemblyscript
 *   asc add.ts -o add.wasm
 */
// eslint-disable-next-line no-undef
export function add(a: i32, b: i32): i32 {
    return a + b
}

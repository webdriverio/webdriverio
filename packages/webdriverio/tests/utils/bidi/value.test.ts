import { describe, it, expect } from 'vitest'
import stringify from 'safe-stable-stringify'

import { deserializeValue } from '../../../src/utils/bidi/index.js'
import { LocalValue } from '../../../src/utils/bidi/value.js'

describe('LocalValue', () => {
    const value = LocalValue.getArgument([
        undefined,
        'string',
        123,
        NaN,
        Infinity,
        -Infinity,
        -0,
        BigInt(9007199254740991),
        new Map([[1, 2]]),
        new Set([1, new Map([['string', true]]), 3, new Map([[1, 2]])]),
        /foobar/
    ])

    it('should be able to serialize it', () => {
        const values = stringify(value.asMap(), null, 2)
        expect(values).toMatchInlineSnapshot(`
          "{
            "type": "array",
            "value": [
              {
                "type": "undefined"
              },
              {
                "type": "string",
                "value": "string"
              },
              {
                "type": "number",
                "value": 123
              },
              {
                "type": "number",
                "value": "NaN"
              },
              {
                "type": "number",
                "value": "Infinity"
              },
              {
                "type": "number",
                "value": "-Infinity"
              },
              {
                "type": "number",
                "value": "-0"
              },
              {
                "type": "bigint",
                "value": "9007199254740991"
              },
              {
                "type": "map",
                "value": [
                  [
                    {
                      "type": "number",
                      "value": 1
                    },
                    {
                      "type": "number",
                      "value": 2
                    }
                  ]
                ]
              },
              {
                "type": "set",
                "value": [
                  {
                    "type": "number",
                    "value": 1
                  },
                  {
                    "type": "map",
                    "value": [
                      [
                        "string",
                        {
                          "type": "boolean",
                          "value": true
                        }
                      ]
                    ]
                  },
                  {
                    "type": "number",
                    "value": 3
                  },
                  {
                    "type": "map",
                    "value": [
                      [
                        {
                          "type": "number",
                          "value": 1
                        },
                        {
                          "type": "number",
                          "value": 2
                        }
                      ]
                    ]
                  }
                ]
              },
              {
                "type": "regexp",
                "value": {
                  "flags": "",
                  "pattern": "foobar"
                }
              }
            ]
          }"
        `)
    })

    it('should be able to deserialize it', () => {
        expect(deserializeValue(value.asMap())).toMatchInlineSnapshot(`
          [
            undefined,
            "string",
            123,
            NaN,
            Infinity,
            -Infinity,
            -0,
            9007199254740991n,
            Map {
              1 => 2,
            },
            Set {
              1,
              Map {
                "string" => true,
              },
              3,
              Map {
                1 => 2,
              },
            },
            /foobar/,
          ]
        `)
    })
})

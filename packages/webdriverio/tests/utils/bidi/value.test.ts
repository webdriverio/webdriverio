import { describe, it, expect } from 'vitest'
import { ELEMENT_KEY } from 'webdriver'
import stringify from 'safe-stable-stringify'

import { deserialize } from '../../../src/utils/bidi/index.js'
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
        /foobar/,
        { foo: 'bar', nested: new Map([['this', 'works']]) },
        { [ELEMENT_KEY]: 'foobar' }
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
                "value": 9007199254740991
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
              },
              {
                "type": "object",
                "value": [
                  [
                    "foo",
                    {
                      "type": "string",
                      "value": "bar"
                    }
                  ],
                  [
                    "nested",
                    {
                      "type": "map",
                      "value": [
                        [
                          "this",
                          {
                            "type": "string",
                            "value": "works"
                          }
                        ]
                      ]
                    }
                  ]
                ]
              },
              {
                "sharedId": "foobar"
              }
            ]
          }"
        `)
    })

    it('should be able to deserialize it', () => {
        expect(deserialize(value.asMap() as any)).toMatchInlineSnapshot(`
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
            {
              "foo": "bar",
              "nested": Map {
                "this" => "works",
              },
            },
            undefined,
          ]
        `)
        expect(deserialize({
            sharedId: 'f.44C98D3D1D8C6C82E24E94E038744493.d.123615DE0B294C5077D7F1903A856E6A.e.9',
            type: 'node',
            value: {
                attributes: {},
                childNodeCount: 9,
                localName: 'body',
                namespaceURI: 'http://www.w3.org/1999/xhtml',
                nodeType: 1,
                shadowRoot: null
            }
        })).toEqual({
            [ELEMENT_KEY]: 'f.44C98D3D1D8C6C82E24E94E038744493.d.123615DE0B294C5077D7F1903A856E6A.e.9'
        })
    })

    it('should resolve references', () => {
        expect(deserialize({
            type: 'array',
            value: [
                {
                    type: 'object',
                    value: [
                        [
                            'id',
                            {
                                type: 'string',
                                value: '__button1'
                            }
                        ] as any,
                        [
                            'properties',
                            {
                                internalId: '8f3ed8d7-b8f7-4f8c-a958-49a94e85d18c',
                                type: 'array',
                                value: [
                                    {
                                        type: 'number',
                                        value: 1
                                    },
                                    {
                                        type: 'number',
                                        value: 2
                                    },
                                    {
                                        type: 'number',
                                        value: 3
                                    }
                                ]
                            }
                        ]
                    ]
                },
                {
                    type: 'object',
                    value: [
                        [
                            'id',
                            {
                                type: 'string',
                                value: '__button2'
                            }
                        ],
                        [
                            'properties',
                            {
                                internalId: '8f3ed8d7-b8f7-4f8c-a958-49a94e85d18c',
                                type: 'array'
                            }
                        ]
                    ]
                }
            ]
        })).toMatchInlineSnapshot(`
          [
            {
              "id": "__button1",
              "properties": [
                1,
                2,
                3,
              ],
            },
            {
              "id": "__button2",
              "properties": [
                1,
                2,
                3,
              ],
            },
          ]
        `)
    })
})

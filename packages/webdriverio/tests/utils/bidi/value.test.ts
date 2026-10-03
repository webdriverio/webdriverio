import { describe, it, expect } from 'vitest'
import { ELEMENT_KEY, SHADOW_ELEMENT_KEY } from 'webdriver'
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

    it('should deserialize a NodeList and an HTMLCollection into element references', () => {
        const nodes = [
            { type: 'node', sharedId: 'f.1.d.1.e.1', value: { localName: 'li', nodeType: 1 } },
            { type: 'node', sharedId: 'f.1.d.1.e.2', value: { localName: 'li', nodeType: 1 } }
        ]
        const references = [
            { [ELEMENT_KEY]: 'f.1.d.1.e.1' },
            { [ELEMENT_KEY]: 'f.1.d.1.e.2' }
        ]

        expect(deserialize({ type: 'nodelist', value: nodes } as any)).toEqual(references)
        expect(deserialize({ type: 'htmlcollection', value: nodes } as any)).toEqual(references)
        expect(deserialize({ type: 'nodelist', value: [] } as any)).toEqual([])
    })

    it('should deserialize a node by its node type, as WebDriver Classic does', () => {
        const comment = { nodeType: 8, childNodeCount: 0, nodeValue: ' a comment ' }
        const text = { nodeType: 3, childNodeCount: 0, nodeValue: ' text ' }
        const nodes = [
            { type: 'node', sharedId: 'f.1.d.1.e.1', value: comment },
            { type: 'node', sharedId: 'f.1.d.1.e.2', value: { localName: 'li', nodeType: 1, childNodeCount: 1 } },
            { type: 'node', sharedId: 'f.1.d.1.e.3', value: text },
            { type: 'node', sharedId: 'f.1.d.1.e.4', value: { localName: 'li', nodeType: 1, childNodeCount: 1 } }
        ]
        const expected = [comment, { [ELEMENT_KEY]: 'f.1.d.1.e.2' }, text, { [ELEMENT_KEY]: 'f.1.d.1.e.4' }]

        expect(deserialize({ type: 'nodelist', value: nodes } as any)).toEqual(expected)
        expect(deserialize({ type: 'array', value: nodes } as any)).toEqual(expected)
        expect(deserialize(nodes[2] as any)).toEqual(text)
        expect(deserialize(nodes[0] as any)).toEqual(comment)

        expect(deserialize({ type: 'node', sharedId: 'f.1.d.1.e.5', value: { nodeType: 9, childNodeCount: 2 } }))
            .toEqual({ [ELEMENT_KEY]: 'f.1.d.1.e.5' })
        expect(deserialize({ type: 'node', sharedId: 'f.1.d.1.e.6', value: { nodeType: 11, childNodeCount: 1, mode: 'open' } }))
            .toEqual({ [SHADOW_ELEMENT_KEY]: 'f.1.d.1.e.6' })
        expect(deserialize({ type: 'node', sharedId: 'f.1.d.1.e.7', value: { nodeType: 11, childNodeCount: 1 } }))
            .toEqual({ nodeType: 11, childNodeCount: 1 })
        expect(deserialize({ type: 'node', sharedId: 'f.1.d.1.e.8' }))
            .toEqual({ [ELEMENT_KEY]: 'f.1.d.1.e.8' })
    })

    it('should pass a shadow root reference as a shared id', () => {
        expect(LocalValue.getArgument({ [SHADOW_ELEMENT_KEY]: 'f.1.d.1.e.6' }).asMap())
            .toEqual({ sharedId: 'f.1.d.1.e.6' })
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

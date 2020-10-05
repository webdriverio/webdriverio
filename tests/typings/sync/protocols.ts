const protocolCommand: WDIOProtocols.CommandEndpoint = {
    command: 'findElementFromElement',
    description: 'The Find Element From Element command is used to find an element from a web element in the current browsing context that can be used for future commands.',
    ref: new URL('https://w3c.github.io/webdriver/#dfn-find-element-from-element'),
    variables: [{
        name: 'elementId',
        description: 'the id of an element returned in a previous call to Find Element(s)'
    }],
    parameters: [{
        name: 'using',
        type: 'string',
        description: 'a valid element location strategy',
        required: true
    }, {
        name: 'value',
        type: 'string',
        description: 'the actual selector that will be used to find an element',
        required: true
    }],
    returns: {
        type: 'String',
        name: 'element',
        description: 'A JSON representation of an element object.'
    }
}

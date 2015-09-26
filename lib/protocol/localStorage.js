/**
 *
 * Protocol bindings for all localStorage operations.
 *
 * <example>
    :localStorage.js
    // get the storage item for the given key
    client.localStorage('GET', someKey, function(err,res) { ... });

    // get all keys of the storage
    client.localStorage(function(err,res) { ... });

    // set the storage item for the given key
    client.localStorage('POST', {key: someKey, value: someValue});

    // remove the storage item for the given key
    client.localStorage('DELETE', 'someKey');

    // clear the storage
    client.localStorage('DELETE');
 * </example>
 *
 * @param {String}         method  method for storage operation
 * @param {Object|String=} args    operation arguments
 *
 * @see  https://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/local_storage
 * @type protocol
 *
 */

let localStorage = function (method = 'GET', args) {
    /**
     * set default options
     */
    let data = {}
    let requestOptions = {
        path: '/session/:sessionId/local_storage',
        method: method.toUpperCase()
    }

    if (requestOptions.method === 'POST' && typeof args === 'object') {
        data = {
            key: args.key,
            value: args.value
        }
    }

    /**
     * add/delete specific key
     */
    if ((requestOptions.method === 'DELETE' && typeof args === 'string') ||
       (requestOptions.method === 'GET' && typeof args === 'string')) {
        requestOptions.path += '/key/' + args
    }

    return this.requestHandler.create(requestOptions, data)
}

export default localStorage

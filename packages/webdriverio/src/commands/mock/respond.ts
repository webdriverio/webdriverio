/**
 * Always respond with same overwrite.
 *
 * <example>
    :respond.js
    it('should demonstrate response overwrite with static data', () => {
        const mock = browser.mock('https://todo-backend-express-knex.herokuapp.com/', {
            method: 'get'
        })

        mock.respond([{
            title: 'Injected (non) completed Todo',
            order: null,
            completed: false
        }, {
            title: 'Injected completed Todo',
            order: null,
            completed: true
        }], {
            statusCode: 200,
            fetchResponse: true // default
        })

        browser.url('https://todobackend.com/client/index.html?https://todo-backend-express-knex.herokuapp.com/')

        $('#todo-list li').waitForExist()
        console.log($$('#todo-list li').map(el => el.getText()))
        // outputs: "[ 'Injected (non) completed Todo', 'Injected completed Todo' ]"
    })

    it('should demonstrate response overwrite with dynamic data', () => {
        const mock = browser.mock('https://todo-backend-express-knex.herokuapp.com/')

        mock.respond((request) => {
            if (request.body.username === 'test') {
                return { ...request.body, foo: 'bar' }
            }
            return request.body
        }, {
            statusCode: () => 200,
            headers: () => ({ foo: 'bar }),
            fetchResponse: false // do not fetch real response
        })
    })
 * </example>
 *
 * @alias mock.respond
 * @param {MockOverwrite}       overwrites              payload to overwrite the response
 * @param {MockResponseParams=} params                  additional respond parameters to overwrite
 * @param {Object=}             params.header           overwrite specific headers
 * @param {Number=}             params.statusCode       overwrite response status code
 * @param {Boolean=}            params.fetchResponse    fetch real response before responding with mocked data
 */
// actual implementation is located in packages/webdriverio/src/utils/interception

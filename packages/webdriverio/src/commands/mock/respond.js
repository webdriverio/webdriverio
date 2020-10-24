/**
 * > This is a __beta__ feature. Please give us feedback and file [an issue](https://github.com/webdriverio/webdriverio/issues/new/choose) if certain scenarions don't work as expected!
 *
 * Always respond with same overwrite.
 *
 * <example>
    :respond.js
    it('should demonstrate the addValue command', () => {
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
        }])

        browser.url('https://todobackend.com/client/index.html?https://todo-backend-express-knex.herokuapp.com/')

        $('#todo-list li').waitForExist()
        console.log($$('#todo-list li').map(el => el.getText()))
        // outputs: "[ 'Injected (non) completed Todo', 'Injected completed Todo' ]"
    })

    it('should demonstrate comparator function', () => {
        const mock = browser.mock('https://todo-backend-express-knex.herokuapp.com/')

        mock.respond((request) => {
            if (body.username === 'test') {
                return { ...body, foo: 'bar' }
            }
            return body
        })
    })
 * </example>
 *
 * @alias mock.respond
 * @param {MockOverwrite}       overwrites         payload to overwrite the response
 * @param {MockResponseParams=} params             additional respond parameters to overwrite
 * @param {Object=}             params.header      overwrite specific headers
 * @param {Number=}              params.statusCode  overwrite response status code
 */
// actual implementation is located in packages/webdriverio/src/utils/interception

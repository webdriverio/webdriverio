/**
 * > This is a __beta__ feature. Please give us feedback and file [an issue](https://github.com/webdriverio/webdriverio/issues/new/choose) if certain scenarions don't work as expected!
 *
 * Only respond once with given overwrite. You can call `respondOnce` multiple
 * consecutive times and it will start with the respond you defined last. If you
 * only use `respondOnce` and the resource is called more times a mock has been
 * defined than it defaults back to the original resource.
 *
 * <example>
    :respondOnce.js
    function getToDos () {
        $('#todo-list li').waitForExist()
        return $$('#todo-list li').map(el => el.getText())
    }

    it('should demonstrate the respondOnce command', () => {
        const mock = browser.mock('https://todo-backend-express-knex.herokuapp.com/', {
            method: 'get'
        })

        mock.respondOnce([{
            title: '3'
        }, {
            title: '2'
        }, {
            title: '1'
        }])

        mock.respondOnce([{
            title: '2'
        }, {
            title: '1'
        }])

        mock.respondOnce([{
            title: '1'
        }])

        browser.url('https://todobackend.com/client/index.html?https://todo-backend-express-knex.herokuapp.com/')
        console.log(getToDos()) // outputs [ '3', '2', '1' ]
        browser.url('https://todobackend.com/client/index.html?https://todo-backend-express-knex.herokuapp.com/')
        console.log(getToDos()) // outputs [ '2', '1' ]
        browser.url('https://todobackend.com/client/index.html?https://todo-backend-express-knex.herokuapp.com/')
        console.log(getToDos()) // outputs [ '1' ]
        browser.url('https://todobackend.com/client/index.html?https://todo-backend-express-knex.herokuapp.com/')
        console.log(getToDos()) // outputs actual resource response
    })
 * </example>
 *
 * @alias mock.respondOnce
 * @param {MockOverwrite}       overwrites         payload to overwrite the response
 * @param {MockResponseParams=} params             additional respond parameters to overwrite
 * @param {Object=}             params.header      overwrite specific headers
 * @param {Number=}             params.statusCode  overwrite response status code
 */
// actual implementation is located in packages/webdriverio/src/utils/interception

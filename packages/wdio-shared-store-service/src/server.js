const polka = require('polka')
const { json } = require('@polka/parse')

const store = {}

const app = polka()
    /**
     * middleware
     * `json` middleware transforms body to json for every request or returns empty object
     */
    .use(json(), validateBody)

    // routes
    .post('/get', (req, res) => {
        res.end(JSON.stringify({ value: store[req.body.key] }))
    })
    .post('/set', (req, res) => {
        store[req.body.key] = req.body.value
        return res.end()
    })

const startServer = () => new Promise((resolve, reject) => {
    /**
     * run server on a random port, `0` stands for random port
     * > If port is omitted or is 0, the operating system will assign
     * > an arbitrary unused port, which can be retrieved by using `server.address().port`
     * https://nodejs.org/api/net.html#net_server_listen_port_host_backlog_callback
     */
    app.listen(0, (err) => {
        /* istanbul ignore next */
        if (err) {
            return reject(err)
        }
        resolve({
            port: app.server.address().port
        })
    })
})

const stopServer = () => new Promise((resolve) => {
    app.server.close(resolve)
})

function validateBody (req, res, next) {
    if (!req.path.endsWith('/get') && !req.path.endsWith('/set')) {
        return next()
    }
    if (req.method === 'POST' && typeof req.body.key !== 'string') {
        res.end(JSON.stringify({ error: 'Invalid payload, key is required.' }))
    }
    next()
}

export default { startServer, stopServer, __store: store }

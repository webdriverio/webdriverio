const { config } = require('./config')

exports.config = Object.assign({}, config, {
    runnerEnv: {
        WDIO_NO_SYNC_SUPPORT: true
    }
})

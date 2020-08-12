class CustomService {
  onPrepare() {
      // TODO: something before all workers launch
  }
}

const conf: WebdriverIO.Config = {
    // can be both array and function
    onComplete: (config, caps) => { },
    onPrepare: [
        () => { }
    ],

    // can be function only
    afterSuite: () => {},

    services: [
        ['appium', {
            logPath: '/foobar',
            command: 'appium',
            args: []
        }],
        [CustomService, {
            someOption: true
        }]
    ],

    automationProtocol: 'webdriver',
    logLevels: {
        webdriver: 'info',
    },

    transformRequest: (requestOptions) => {
        requestOptions.headers['X-Custom-Auth'] = 'custom_header_value'
        return requestOptions
    },
    transformResponse: (response, requestOptions) => {
        if (requestOptions.method === 'DELETE' && response.statusCode === 200) {
            console.log(response.body)
        }

        return response
    },

    filesToWatch: [
        '/foo/page-objects/**/*.page.js',
    ],
}

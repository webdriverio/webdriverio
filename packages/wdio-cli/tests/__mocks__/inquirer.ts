export default {
    prompt: jest.fn().mockReturnValue(Promise.resolve({
        runner: '@wdio/local-runner--$local',
        framework: '@wdio/mocha-framework$--$mocha',
        reporters: ['@wdio/spec-reporter$--$spec'],
        services: ['@wdio/sauce-service--$sauce']
    }))
}

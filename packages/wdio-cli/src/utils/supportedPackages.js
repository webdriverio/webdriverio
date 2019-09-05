/**
 * We have to use a string hash for value because InquirerJS default values do not work if we have
 * objects as a `value` to be stored from the user's answers.
 */
export const supportedPackages = {
    runner: [
        { name: 'local', value: '@wdio/local-runner$--$local' }
    ],
    framework: [
        { name: 'mocha', value: '@wdio/mocha-framework$--$mocha' },
        { name: 'jasmine', value: '@wdio/jasmine-framework$--$jasmine' },
        { name: 'cucumber', value: '@wdio/cucumber-framework$--$cucumeber' }
    ],
    reporter: [
        { name: 'spec', value: '@wdio/spec-reporter$--$spec' },
        { name: 'dot', value: '@wdio/dot-reporter$--$dot' },
        { name: 'junit', value: '@wdio/junit-reporter$--$junit' },
        { name: 'allure', value: '@wdio/allure-reporter$--$allure' },
        { name: 'sumologic', value: '@wdio/sumologic-reporter$--$sumologic' },
        { name: 'concise', value: '@wdio/concise-reporter$--$concise' },
        // external
        { name: 'reportportal', value: 'wdio-reportportal-reporter$--$reportportal' },
        { name: 'video', value: 'wdio-video-reporter$--$video' },
        { name: 'json', value: 'wdio-json-reporter$--$json' },
        { name: 'cucumber', value: 'wdio-cucumber-reporter$--$cucumber' },
        { name: 'mochawesome', value: 'wdio-mochawesome-reporter$--$mochawesome' },
        { name: 'timeline', value: 'wdio-timeline-reporter$--$timeline' },
        { name: 'html', value: '@rppi/wdio-html-reporter$--$html' },
    ],
    service: [
        // inquirerjs shows list as its orderer in array
        // put chromedriver first as it is the default option
        { name: 'chromedriver', value: 'wdio-chromedriver-service$--$chromedriver' },
        // internal
        { name: 'sauce', value: '@wdio/sauce-service$--$sauce' },
        { name: 'testingbot', value: '@wdio/testingbot-service$--$testingbot' },
        { name: 'selenium-standalone', value: '@wdio/selenium-standalone-service$--$selenium-standalone' },
        { name: 'devtools', value: '@wdio/devtools-service$--$devtools' },
        { name: 'applitools', value: '@wdio/applitools-service$--$applitools' },
        { name: 'browserstack', value: '@wdio/browserstack-service$--$browserstack' },
        { name: 'appium', value: '@wdio/appium-service$--$appium' },
        { name: 'firefox-profile', value: '@wdio/firefox-profile-service$--$firefox-profile' },
        // external
        { name: 'zafira-listener', value: 'wdio-zafira-listener-service$--$zafira-listener' },
        { name: 'reportportal', value: 'wdio-reportportal-service$--$reportportal' },
        { name: 'crossbrowsertesting', value: 'wdio-crossbrowsertesting-service$--$crossbrowsertesting' },
        { name: 'docker', value: 'wdio-docker-service$--$docker' },
    ],
}

const SDK_EVENTS = {
    SDK_SETUP: 'sdk:setup',
    SDK_CLEANUP: 'sdk:cleanup',
    SDK_PRE_TEST: 'sdk:pre-test',
    SDK_TEST: 'sdk:test',
    SDK_POST_TEST: 'sdk:post-test',
    SDK_HOOK: 'sdk:hook',
    SDK_DRIVER: 'sdk:driver',
    SDK_A11Y: 'sdk:a11y',
    SDK_O11Y: 'sdk:o11y',
    SDK_AUTO_CAPTURE: 'sdk:auto-capture',
    SDK_PROXY_SETUP: 'sdk:proxy-setup',
    SDK_TESTHUB: 'sdk:testhub',
    SDK_AUTOMATE: 'sdk:automate',
    SDK_APP_AUTOMATE: 'sdk:app-automate',
    SDK_TURBOSCALE: 'sdk:turboscale',
    SDK_PERCY: 'sdk:percy',
    SDK_PRE_INITIALIZE: 'sdk:driver:pre-initialization',
    SDK_POST_INITIALIZE: 'sdk:driver:post-initialization'
}

export default {
    EVENTS: SDK_EVENTS,
    TESTHUB_EVENTS: {
        START: `${SDK_EVENTS.SDK_TESTHUB}:start`,
        STOP: `${SDK_EVENTS.SDK_TESTHUB}:stop`
    },
    AUTOMATE_EVENTS: {
        KEEP_ALIVE: `${SDK_EVENTS.SDK_AUTOMATE}:keep-alive`,
        HUB_MANAGEMENT: `${SDK_EVENTS.SDK_AUTOMATE}:hub-management`,
        LOCAL_START: `${SDK_EVENTS.SDK_AUTOMATE}:local-start`,
        LOCAL_STOP: `${SDK_EVENTS.SDK_AUTOMATE}:local-stop`,
        DRIVER_MANAGE: `${SDK_EVENTS.SDK_AUTOMATE}:driver-manage`,
        SESSION_NAME: `${SDK_EVENTS.SDK_AUTOMATE}:session-name`,
        SESSION_STATUS: `${SDK_EVENTS.SDK_AUTOMATE}:session-status`,
        SESSION_ANNOTATION: `${SDK_EVENTS.SDK_AUTOMATE}:session-annotation`,
        IDLE_TIMEOUT: `${SDK_EVENTS.SDK_AUTOMATE}:idle-timeout`,
        GENERATE_CI_ARTIFACT: `${SDK_EVENTS.SDK_AUTOMATE}:ci-artifacts`,
        PRINT_BUILDLINK: `${SDK_EVENTS.SDK_AUTOMATE}:print-buildlink`
    },
    A11Y_EVENTS: {
        PERFORM_SCAN: `${SDK_EVENTS.SDK_A11Y}:driver-performscan`,
        SAVE_RESULTS: `${SDK_EVENTS.SDK_A11Y}:save-results`,
        GET_RESULTS: `${SDK_EVENTS.SDK_A11Y}:get-accessibility-results`,
        GET_RESULTS_SUMMARY: `${SDK_EVENTS.SDK_A11Y}:get-accessibility-results-summary`
    },
    PERCY_EVENTS: {
        DOWNLOAD: `${SDK_EVENTS.SDK_PERCY}:download`,
        SCREENSHOT: `${SDK_EVENTS.SDK_PERCY}:screenshot`,
        START: `${SDK_EVENTS.SDK_PERCY}:start`,
        STOP: `${SDK_EVENTS.SDK_PERCY}:stop`,
        AUTO_CAPTURE: `${SDK_EVENTS.SDK_PERCY}:auto-capture`,
        SNAPSHOT: `${SDK_EVENTS.SDK_PERCY}:snapshot`,
        SCREENSHOT_APP: `${SDK_EVENTS.SDK_PERCY}:screenshot-app`
    },
    O11y_EVENTS: {
        SYNC: `${SDK_EVENTS.SDK_O11Y}:sync`,
        TAKE_SCREENSHOT: `${SDK_EVENTS.SDK_O11Y}:driver-takeScreenShot`,
        PRINT_BUILDLINK: `${SDK_EVENTS.SDK_O11Y}:print-buildlink`
    },
    HOOK_EVENTS: {
        BEFORE_EACH: `${SDK_EVENTS.SDK_HOOK}:before-each`,
        AFTER_EACH: `${SDK_EVENTS.SDK_HOOK}:after-each`,
        AFTER_ALL: `${SDK_EVENTS.SDK_HOOK}:after-all`,
        BEFORE_ALL: `${SDK_EVENTS.SDK_HOOK}:before-all`,
        BEFORE: `${SDK_EVENTS.SDK_HOOK}:before`,
        AFTER: `${SDK_EVENTS.SDK_HOOK}:after`
    },
    TURBOSCALE_EVENTS: {
        HUB_MANAGEMENT: `${SDK_EVENTS.SDK_TURBOSCALE}:hub-management`,
        PRINT_BUILDLINK: `${SDK_EVENTS.SDK_TURBOSCALE}:print-buildlink`
    },
    APP_AUOTMATE_EVENTS: {
        APP_UPLOAD: `${SDK_EVENTS.SDK_APP_AUTOMATE}:app-upload`
    },
    DRIVER_EVENT: {
        QUIT: `${SDK_EVENTS.SDK_DRIVER}:quit`,
        GET: `${SDK_EVENTS.SDK_DRIVER}:get`,
        PRE_EXECUTE: `${SDK_EVENTS.SDK_DRIVER}:pre-execute`,
        POST_EXECUTE: `${SDK_EVENTS.SDK_DRIVER}:post-execute`
    }
}

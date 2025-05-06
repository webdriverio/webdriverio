export const EVENTS = {
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
    SDK_POST_INITIALIZE: 'sdk:driver:post-initialization',
    SDK_CLI_START: 'sdk:cli:start',
    SDK_CLI_DOWNLOAD: 'sdk:cli:download',
    SDK_CLI_CHECK_UPDATE: 'sdk:cli:check-update',
    SDK_CLI_ON_BOOTSTRAP: 'sdk:cli:on-bootstrap',
    SDK_CLI_ON_CONNECT: 'sdk:cli:on-connect',
    SDK_CLI_ON_STOP: 'sdk:cli:on-stop',
    SDK_START_BIN_SESSION: 'sdk:startBinSession',
    SDK_CONNECT_BIN_SESSION: 'sdk:connectBinSession'
}

export const TESTHUB_EVENTS = {
    START: `${EVENTS.SDK_TESTHUB}:start`,
    STOP: `${EVENTS.SDK_TESTHUB}:stop`
}

export const AUTOMATE_EVENTS = {
    KEEP_ALIVE: `${EVENTS.SDK_AUTOMATE}:keep-alive`,
    HUB_MANAGEMENT: `${EVENTS.SDK_AUTOMATE}:hub-management`,
    LOCAL_START: `${EVENTS.SDK_AUTOMATE}:local-start`,
    LOCAL_STOP: `${EVENTS.SDK_AUTOMATE}:local-stop`,
    DRIVER_MANAGE: `${EVENTS.SDK_AUTOMATE}:driver-manage`,
    SESSION_NAME: `${EVENTS.SDK_AUTOMATE}:session-name`,
    SESSION_STATUS: `${EVENTS.SDK_AUTOMATE}:session-status`,
    SESSION_ANNOTATION: `${EVENTS.SDK_AUTOMATE}:session-annotation`,
    IDLE_TIMEOUT: `${EVENTS.SDK_AUTOMATE}:idle-timeout`,
    GENERATE_CI_ARTIFACT: `${EVENTS.SDK_AUTOMATE}:ci-artifacts`,
    PRINT_BUILDLINK: `${EVENTS.SDK_AUTOMATE}:print-buildlink`
}

export const A11Y_EVENTS = {
    PERFORM_SCAN: `${EVENTS.SDK_A11Y}:driver-performscan`,
    SAVE_RESULTS: `${EVENTS.SDK_A11Y}:save-results`,
    GET_RESULTS: `${EVENTS.SDK_A11Y}:get-accessibility-results`,
    GET_RESULTS_SUMMARY: `${EVENTS.SDK_A11Y}:get-accessibility-results-summary`
}

export const PERCY_EVENTS = {
    DOWNLOAD: `${EVENTS.SDK_PERCY}:download`,
    SCREENSHOT: `${EVENTS.SDK_PERCY}:screenshot`,
    START: `${EVENTS.SDK_PERCY}:start`,
    STOP: `${EVENTS.SDK_PERCY}:stop`,
    AUTO_CAPTURE: `${EVENTS.SDK_PERCY}:auto-capture`,
    SNAPSHOT: `${EVENTS.SDK_PERCY}:snapshot`,
    SCREENSHOT_APP: `${EVENTS.SDK_PERCY}:screenshot-app`
}

export const O11Y_EVENTS = {
    SYNC: `${EVENTS.SDK_O11Y}:sync`,
    TAKE_SCREENSHOT: `${EVENTS.SDK_O11Y}:driver-takeScreenShot`,
    PRINT_BUILDLINK: `${EVENTS.SDK_O11Y}:print-buildlink`
}

export const HOOK_EVENTS = {
    BEFORE_EACH: `${EVENTS.SDK_HOOK}:before-each`,
    AFTER_EACH: `${EVENTS.SDK_HOOK}:after-each`,
    AFTER_ALL: `${EVENTS.SDK_HOOK}:after-all`,
    BEFORE_ALL: `${EVENTS.SDK_HOOK}:before-all`,
    BEFORE: `${EVENTS.SDK_HOOK}:before`,
    AFTER: `${EVENTS.SDK_HOOK}:after`
}

export const TURBOSCALE_EVENTS = {
    HUB_MANAGEMENT: `${EVENTS.SDK_TURBOSCALE}:hub-management`,
    PRINT_BUILDLINK: `${EVENTS.SDK_TURBOSCALE}:print-buildlink`
}

export const APP_AUTOMATE_EVENTS = {
    APP_UPLOAD: `${EVENTS.SDK_APP_AUTOMATE}:app-upload`
}

export const DRIVER_EVENT = {
    QUIT: `${EVENTS.SDK_DRIVER}:quit`,
    GET: `${EVENTS.SDK_DRIVER}:get`,
    PRE_EXECUTE: `${EVENTS.SDK_DRIVER}:pre-execute`,
    POST_EXECUTE: `${EVENTS.SDK_DRIVER}:post-execute`
}

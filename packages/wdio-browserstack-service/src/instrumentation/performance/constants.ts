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
    SDK_CONNECT_BIN_SESSION: 'sdk:connectBinSession',
    // New events from Python SDK
    SDK_DRIVER_INIT: 'sdk:driverInit',
    SDK_FIND_NEAREST_HUB: 'sdk:findNearestHub',
    SDK_AUTOMATION_FRAMEWORK_INIT: 'sdk:automationFrameworkInit',
    SDK_AUTOMATION_FRAMEWORK_START: 'sdk:automationFrameworkStart',
    SDK_AUTOMATION_FRAMEWORK_STOP: 'sdk:automationFrameworkStop',
    SDK_ACCESSIBILITY_CONFIG: 'sdk:accessibilityConfig',
    SDK_OBSERVABILITY_CONFIG: 'sdk:observabilityConfig',
    SDK_AI_SELF_HEAL_STEP: 'sdk:aiSelfHealStep',
    SDK_AI_SELF_HEAL_GET_RESULT: 'sdk:aiSelfHealGetResult',
    SDK_TEST_FRAMEWORK_EVENT: 'sdk:testFrameworkEvent',
    SDK_TEST_SESSION_EVENT: 'sdk:testSessionEvent',
    SDK_CLI_LOG_CREATED_EVENT: 'sdk:cli:logCreatedEvent',
    SDK_CLI_ENQUEUE_TEST_EVENT: 'sdk:cli:enqueueTestEvent',
    SDK_ON_STOP: 'sdk:onStop',
    SDK_SEND_LOGS: 'sdk:sendlogs',
    // Funnel Events
    SDK_FUNNEL_TEST_ATTEMPTED: 'sdk:funnel:test-attempted',
    SDK_FUNNEL_TEST_SUCCESSFUL: 'sdk:funnel:test-successful',
    // Log Upload Events
    SDK_UPLOAD_LOGS: 'sdk:upload-logs',
    // Key Metrics Events
    SDK_SEND_KEY_METRICS: 'sdk:send-key-metrics',
    SDK_KEY_METRICS_PREPARATION: 'sdk:key-metrics:preparation',
    SDK_KEY_METRICS_UPLOAD: 'sdk:key-metrics:upload',
    // CLI Binary Events
    SDK_CLI_DOWNLOAD_BINARY: 'sdk:cli:download-binary',
    SDK_CLI_BINARY_VERIFICATION: 'sdk:cli:binary-verification',
    // Cleanup & Shutdown Events (tracking gap between driver:quit and funnel:test-successful)
    SDK_LISTENER_WORKER_END: 'sdk:listener:worker-end',
    SDK_PERCY_TEARDOWN: 'sdk:percy:teardown',
    SDK_WORKER_SAVE_DATA: 'sdk:worker:save-data',
    SDK_PERFORMANCE_REPORT_GEN: 'sdk:performance:report-generation',
    SDK_PERFORMANCE_JSON_WRITE: 'sdk:performance:json-write',
    SDK_PERFORMANCE_HTML_GEN: 'sdk:performance:html-generation',
    // Device Allocation Event (tracking gap between beforeSession and before hooks)
    SDK_DEVICE_ALLOCATION: 'sdk:device-allocation'
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
    POST_EXECUTE: `${EVENTS.SDK_DRIVER}:post-execute`,
    INIT: EVENTS.SDK_DRIVER_INIT,
    PRE_INITIALIZE: EVENTS.SDK_PRE_INITIALIZE,
    POST_INITIALIZE: EVENTS.SDK_POST_INITIALIZE
}

/**
 * Framework lifecycle events for automation framework tracking
 */
export const FRAMEWORK_EVENTS = {
    INIT: EVENTS.SDK_AUTOMATION_FRAMEWORK_INIT,
    START: EVENTS.SDK_AUTOMATION_FRAMEWORK_START,
    STOP: EVENTS.SDK_AUTOMATION_FRAMEWORK_STOP
}

/**
 * Module configuration events
 */
export const CONFIG_EVENTS = {
    ACCESSIBILITY: EVENTS.SDK_ACCESSIBILITY_CONFIG,
    OBSERVABILITY: EVENTS.SDK_OBSERVABILITY_CONFIG
}

/**
 * AI self-healing events
 */
export const AI_EVENTS = {
    SELF_HEAL_STEP: EVENTS.SDK_AI_SELF_HEAL_STEP,
    SELF_HEAL_GET_RESULT: EVENTS.SDK_AI_SELF_HEAL_GET_RESULT
}

/**
 * Event dispatcher events for test framework and session tracking
 */
export const DISPATCHER_EVENTS = {
    TEST_FRAMEWORK: EVENTS.SDK_TEST_FRAMEWORK_EVENT,
    TEST_SESSION: EVENTS.SDK_TEST_SESSION_EVENT,
    LOG_CREATED: EVENTS.SDK_CLI_LOG_CREATED_EVENT,
    ENQUEUE_TEST: EVENTS.SDK_CLI_ENQUEUE_TEST_EVENT
}

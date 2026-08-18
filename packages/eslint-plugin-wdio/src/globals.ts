import globals from 'globals'

export const sharedGlobals = {
    $: false,
    $$: false,
    browser: false,
    driver: false,
    expect: false,
    multiremotebrowser: false,
    multiRemoteBrowser: false,
    // To be more user friendly we add mocha and node globals as well, else the use need to configure themself
    ...globals.mocha,
    ...globals.node,
} as const

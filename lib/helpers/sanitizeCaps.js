'use strict';

function sanitize(str) {

    if(!str) return '';

    return String(str)
        .replace(/\./, '_')
        .replace(/\s/, '')
        .toLowerCase();
}

module.exports = function(caps) {
    /**
     * mobile caps
     */
    if(caps.deviceName) {
        return sanitize(caps.deviceName) +
               sanitize(caps.platformName) +
               sanitize(caps.platformVersion);
    }

    return sanitize(caps.browserName) +
           sanitize(caps.platform) +
           sanitize(caps.version);
};
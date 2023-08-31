export function testStartEvent() {
    return `
        const callback = arguments[arguments.length - 1]
        const fn = () => {
            window.addEventListener('A11Y_TAP_STARTED', fn2)
            const e = new CustomEvent('A11Y_FORCE_START')
            window.dispatchEvent(e)
        }
        const fn2 = () => {
            window.removeEventListener('A11Y_TAP_STARTED', fn)
            callback()
        }
        fn()
    `
}

export function testForceStop() {
    return `
        const e = new CustomEvent('A11Y_FORCE_STOP')
        window.dispatchEvent(e)
    `
}

export function testStop() {
    return `
        const callback = arguments[arguments.length - 1];

        this.res = null;
        if (arguments[0].saveResults) {
        window.addEventListener('A11Y_TAP_TRANSPORTER', (event) => {
            window.tapTransporterData = event.detail;
            this.res = window.tapTransporterData;
            callback(this.res);
        });
        }
        const e = new CustomEvent('A11Y_TEST_END', {detail: arguments[0]});
        window.dispatchEvent(e);
        if (arguments[0].saveResults !== true ) {
        callback();
        }
    `
}

export function accessibilityResults() {
    return `
        return new Promise(function (resolve, reject) {
            try {
            const event = new CustomEvent('A11Y_TAP_GET_RESULTS');
            const fn = function (event) {
                window.removeEventListener('A11Y_RESULTS_RESPONSE', fn);
                resolve(event.detail.data);
            };
            window.addEventListener('A11Y_RESULTS_RESPONSE', fn);
            window.dispatchEvent(event);
            } catch {
            reject();
            }
        });
    `
}

export function accessibilityResultsSummary() {
    return `
        return new Promise(function (resolve, reject) {
        try{
            const event = new CustomEvent('A11Y_TAP_GET_RESULTS_SUMMARY');
            const fn = function (event) {
                window.removeEventListener('A11Y_RESULTS_SUMMARY_RESPONSE', fn);
                resolve(event.detail.summary);
            };
            window.addEventListener('A11Y_RESULTS_SUMMARY_RESPONSE', fn);
            window.dispatchEvent(event);
        } catch {
            reject();
        }
        });
    `
}

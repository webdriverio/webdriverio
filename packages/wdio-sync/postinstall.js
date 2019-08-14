/**
 * We need to identify which version of fibers to install depending on NodeJS version.
 * Minimum suppored version of WebdriverIO is 8, we need to make sure project works also with v10 and above.
 *
 * NodeJS 8     - fibers@3
 * NodeJS 10+   - fibers@4
 *
 * see https://www.npmjs.com/package/fibers#supported-platforms
 */

/* eslint-disable semi */
const childProcess = require('child_process');

const fibersVersion = getFibersVerion();

// even for win64
// see https://nodejs.org/api/process.html#process_process_platform
const isWin = process.platform === 'win32';
const installCommand = 'npm install --no-save fibers@' + fibersVersion;

console.log('Installing fibers v' + fibersVersion);
isWin ? runCmd(installCommand) : runSh(installCommand);

function runSh(command) {
    return childProcess.spawnSync('sh', ['-c', command]);
}

function runCmd(command) {
    const cmd = process.env.comspec || 'cmd';
    return childProcess.spawnSync(cmd, ['/c', command]);
}

function getFibersVerion() {
    try {
        if (Number(process.version.split('.')[0].match(/^v(\d+)/)[1]) < 10) {
            return 3;
        }
    } catch (err) {
        // if something went wrong install fibers@4
    }
    return 4;
}

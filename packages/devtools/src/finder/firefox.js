/* istanbul ignore file */

/**
 * @license Copyright 2016 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
import path from 'path'
import { execSync } from 'child_process'
import { canAccess } from '@wdio/utils'

import { sort, findByWhich } from '../utils'

const newLineRegex = /\r?\n/

function darwin() {
    const suffixes = [
        '/Contents/MacOS/firefox-bin'
    ]

    const LSREGISTER = '/System/Library/Frameworks/CoreServices.framework' +
        '/Versions/A/Frameworks/LaunchServices.framework' +
        '/Versions/A/Support/lsregister'

    const installations = []

    execSync(
        `${LSREGISTER} -dump` +
        ' | grep -i \'Firefox Nightly\\?.app.*$\'' +
        ' | awk \'{$1=""; print $0}\''
    )
        .toString()
        .split(newLineRegex)
        .forEach((inst) => {
            suffixes.forEach(suffix => {
                const execPath = path.join(inst.substring(0, inst.indexOf('.app') + 4).trim(), suffix)
                if (canAccess(execPath) && installations.indexOf(execPath) === -1) {
                    installations.push(execPath)
                }
            })
        })

    /**
     * Retains one per line to maintain readability.
     */
    const priorities = [
        { regex: new RegExp(`^${process.env.HOME}/Applications/.*Firefox.app`), weight: 50 },
        { regex: /^\/Applications\/.*Firefox.app/, weight: 100 },
        { regex: /^\/Volumes\/.*Firefox.app/, weight: -2 }
    ]

    const whichFinds = findByWhich(
        ['firefox-nightly'],
        [{ regex: /firefox-nightly/, weight: 51 }]
    )
    const installFinds = sort(installations, priorities)
    return [...installFinds, ...whichFinds]
}

/**
 * Look for linux executables in 3 ways
 * 1. Look into the directories where .desktop are saved on gnome based distro's
 * 2. Look for edge by using the which command
 */
function linux() {
    let installations = []

    // 1. Look into the directories where .desktop are saved on gnome based distro's
    const desktopInstallationFolders = [
        path.join(require('os').homedir(), '.local/share/applications/'),
        '/usr/share/applications/',
    ]
    desktopInstallationFolders.forEach(folder => {
        installations = installations.concat(findFirefoxExecutables(folder))
    })

    return findByWhich(
        ['firefox-nightly', 'firefox'],
        [{ regex: /firefox/, weight: 51 }]
    )
}

function win32() {
    const installations = []
    const suffixes = [
        `${path.sep}Firefox Nightly${path.sep}Application${path.sep}firefox.exe`
    ]

    const prefixes = [
        process.env.LOCALAPPDATA, process.env.PROGRAMFILES, process.env['PROGRAMFILES(X86)']
    ].filter(Boolean)

    prefixes.forEach(prefix => suffixes.forEach(suffix => {
        const firefoxPath = path.join(prefix, suffix)
        if (canAccess(firefoxPath)) {
            installations.push(firefoxPath)
        }
    }))

    return installations
}

function findFirefoxExecutables(folder) {
    const argumentsRegex = /(^[^ ]+).*/ // Take everything up to the first space
    const edgeExecRegex = '^Exec=/.*/(firefox)-.*'

    let installations = []
    if (canAccess(folder)) {
        let execPaths

        // Some systems do not support grep -R so fallback to -r.
        // See https://github.com/GoogleChrome/chrome-launcher/issues/46 for more context.
        try {
            execPaths = execSync(
                `grep -ER "${edgeExecRegex}" ${folder} | awk -F '=' '{print $2}'`, { stdio: 'pipe' })
        } catch (e) {
            execPaths = execSync(
                `grep -Er "${edgeExecRegex}" ${folder} | awk -F '=' '{print $2}'`, { stdio: 'pipe' })
        }

        execPaths = execPaths.toString().split(newLineRegex).map(
            (execPath) => execPath.replace(argumentsRegex, '$1'))

        execPaths.forEach((execPath) => canAccess(execPath) && installations.push(execPath))
    }

    return installations
}

export default {
    darwin,
    linux,
    win32
}

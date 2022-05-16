/* istanbul ignore file */

/**
 * @license Copyright 2016 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
import os from 'node:os'
import path from 'node:path'
import { execSync } from 'node:child_process'
import { getEdgePath } from 'edge-paths'
import { canAccess } from '@wdio/utils'

import { sort, findByWhich } from '../utils.js'
import { darwinGetAppPaths, darwinGetInstallations } from './finder.js'

const newLineRegex = /\r?\n/
const EDGE_BINARY_NAMES = ['edge', 'msedge', 'microsoftedge']
const EDGE_REGEX = /((ms|microsoft))?edge/g

function darwin() {
    const suffixes = [
        '/Contents/MacOS/Microsoft Edge'
    ]

    const appName = 'Microsoft Edge'
    const defaultPath = `/Applications/${appName}.app${suffixes[0]}`

    let installations
    if (canAccess(defaultPath)) {
        installations = [defaultPath]
    } else {
        const appPaths = darwinGetAppPaths(appName)
        installations = darwinGetInstallations(appPaths, suffixes)
    }

    // Retains one per line to maintain readability.
    // clang-format off
    const priorities = [
        { regex: new RegExp(`^${process.env.HOME}/Applications/.*Microsoft Edge.app`), weight: 50 },
        { regex: /^\/Applications\/.*Microsoft Edge.app/, weight: 100 },
        { regex: /^\/Volumes\/.*Microsoft Edge.app/, weight: -2 }
    ]

    const whichFinds = findByWhich(
        EDGE_BINARY_NAMES,
        [{ regex: EDGE_REGEX, weight: 51 }]
    )
    const installFinds = sort(installations, priorities)
    return [...installFinds, ...whichFinds]
}

/**
 * Look for linux executables in 3 ways
 * 1. Look into the directories where .desktop are saved on gnome based distros
 * 2. Look for edge by using the which command
 */
function linux() {
    let installations: string[] = []

    // 1. Look into the directories where .desktop are saved on gnome based distros
    const desktopInstallationFolders = [
        path.join(os.homedir(), '.local/share/applications/'),
        '/usr/share/applications/',
    ]
    desktopInstallationFolders.forEach(folder => {
        installations = installations.concat(findEdgeExecutables(folder))
    })

    return findByWhich(
        EDGE_BINARY_NAMES,
        [{ regex: EDGE_REGEX, weight: 51 }]
    )
}

function win32 () {
    const installations: string[] = []
    const suffixes = [
        `${path.sep}Microsoft${path.sep}Edge${path.sep}Application${path.sep}edge.exe`,
        `${path.sep}Microsoft${path.sep}Edge${path.sep}Application${path.sep}msedge.exe`,
        `${path.sep}Microsoft${path.sep}Edge Dev${path.sep}Application${path.sep}msedge.exe`
    ]

    const prefixes = [
        process.env.LOCALAPPDATA || '', process.env.PROGRAMFILES || '', process.env['PROGRAMFILES(X86)'] || ''
    ].filter(Boolean)

    prefixes.forEach(prefix => suffixes.forEach(suffix => {
        const edgePath = path.join(prefix, suffix)
        if (canAccess(edgePath)) {
            installations.push(edgePath)
        }
    }))

    /**
     * fallback using edge-path
     */
    if (installations.length === 0) {
        const edgePath = getEdgePath()
        if (canAccess(edgePath)) {
            installations.push(edgePath)
        }
    }

    return installations
}

function findEdgeExecutables(folder: string) {
    const argumentsRegex = /(^[^ ]+).*/ // Take everything up to the first space
    const edgeExecRegex = '^Exec=/.*/(edge)-.*'

    let installations: string[] = []
    if (canAccess(folder)) {
        let execPaths

        // Some systems do not support grep -R so fallback to -r.
        // See https://github.com/GoogleChrome/chrome-launcher/issues/46 for more context.
        try {
            execPaths = execSync(
                `grep -ER "${edgeExecRegex}" ${folder} | awk -F '=' '{print $2}'`, { stdio: 'pipe' })
        } catch (err: any) {
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

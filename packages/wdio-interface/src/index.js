process.title = 'WDIO Testrunner';

import blessed from 'blessed'

import { BOX_STYLE } from './constants'

export class WDIOCLIInterface {
    constructor () {
        this.screen = blessed.screen({
            smartCSR: true,
            log: process.env.HOME + '/blessed-terminal.log',
            fullUnicode: true,
            dockBorders: true,
            ignoreDockContrast: true
        })

        this.runnerWindow = blessed.box({
            parent: this.screen,
            label: ' WDIO Testrunner ',
            left: 0,
            top: 0,
            width: '100%',
            height: '30%',
            border: 'line',
            style: BOX_STYLE
        })

        this.logWindow = blessed.box({
            parent: this.screen,
            label: ' WebdriverIO Logs ',
            left: 0,
            top: '30%-1',
            width: '50%+2',
            height: '70%+1',
            border: 'line',
            style: BOX_STYLE
        })

        this.reporterWindow = blessed.box({
            parent: this.screen,
            label: ' Reporter ',
            left: '50%-1',
            top: '30%-1',
            width: '50%+2',
            height: '70%+1',
            border: 'line',
            style: BOX_STYLE
        })

        this.windows = [this.runnerWindow, this.logWindow, this.reporterWindow]
        this.windows.forEach((term) => {
            term.on('title', (title) => {
                this.screen.title = title;
                term.setLabel(' ' + title + ' ');
                this.screen.render();
            });
        })

        this.runnerWindow.focus()
        this.screen.key('C-c', () => this.screen.destroy())
        this.screen.program.key('S-tab', () => {
            this.screen.focusNext();
            this.screen.render();
        })
        this.screen.render()
    }
}

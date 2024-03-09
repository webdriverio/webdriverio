import path from 'node:path'
import fs from 'node:fs'
import os from 'node:os'

class AccessibilityScripts {
    private static instance: AccessibilityScripts | null = null

    public performScan: string | null = null
    public getResults: string | null = null
    public getResultsSummary: string | null = null
    public saveTestResults: string | null = null
    public commandsToWrap: Array<any> | null = null

    public browserstackFolderPath = path.join(os.homedir(), '.browserstack')
    public commandsPath = path.join(this.browserstackFolderPath, 'commands.json')

    // don't allow to create instances from it other than through `checkAndGetInstance`
    private constructor() {}

    public static checkAndGetInstance() {
        if (!AccessibilityScripts.instance) {
            AccessibilityScripts.instance = new AccessibilityScripts()
            AccessibilityScripts.instance.readFromExistingFile()
        }
        return AccessibilityScripts.instance
    }

    public readFromExistingFile() {
        try {
            if (fs.existsSync(this.commandsPath)) {
                const data = fs.readFileSync(this.commandsPath, 'utf8')
                if (data) {
                    this.update(JSON.parse(data))
                }
            }
        } catch (error: any) {
            /* Do nothing */
        }
    }

    public update(data: { commands: [any], scripts: { scan: null; getResults: null; getResultsSummary: null; saveResults: null; }; }) {
        if (data.scripts) {
            this.performScan = data.scripts.scan
            this.getResults = data.scripts.getResults
            this.getResultsSummary = data.scripts.getResultsSummary
            this.saveTestResults = data.scripts.saveResults
        }
        if (data.commands && data.commands.length) {
            this.commandsToWrap = data.commands
        }
    }

    public store() {
        if (!fs.existsSync(this.browserstackFolderPath)){
            fs.mkdirSync(this.browserstackFolderPath)
        }

        fs.writeFileSync(this.commandsPath, JSON.stringify({
            commands: this.commandsToWrap,
            scripts: {
                scan: this.performScan,
                getResults: this.getResults,
                getResultsSummary: this.getResultsSummary,
                saveResults: this.saveTestResults,
            }
        }))
    }
}

export default AccessibilityScripts.checkAndGetInstance()

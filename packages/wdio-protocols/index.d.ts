/// <reference types="node"/>

declare namespace WDIOProtocols {
    type CommandPath = 'string'
    type CommandMethod = 'POST' | 'GET' | 'DELETE'
    type Protocol = Record<CommandPath, Record<CommandMethod, CommandEndpoint>>

    /**
     * describes a command endpoint
     */
    interface CommandEndpoint {
        /**
         * command name
         */
        command: string
        /**
         * command description
         */
        description: string
        /**
         * link to specification reference
         */
        ref: URL
        /**
         * supported command parameters
         */
        parameters: CommandParameters[]
        /**
         * variables within the command path (e.g. /:sessionId/element)
         */
        variables?: CommandPathVariables[]
        /**
         * supported environments
         */
        support?: SupportedEnvironments
        /**
         * set to true if command is only supported in Selenium Hub Node
         */
        isHubCommand?: boolean
    }

    interface CommandPathVariables {
        name: string
        description: string
    }

    interface CommandParameters {
        name: string,
        type: string,
        description: string,
        required: boolean
    }

    type Platform = 'ios' | 'android'
    type Environments = 'XCUITest' | 'UIAutomation' | 'UiAutomator'

    /**
     * supported mobile environments, e.g.
     * ```
     * "ios": {
     *   "UIAutomation": "8.0 to 9.3"
     * }
     * ```
     */
    type SupportedEnvironments = Record<Platform, Record<Environments, string>>
}

declare module "@wdio/protocols" {
    export default WDIOProtocols
}

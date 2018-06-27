/**
 * Multiremote class
 */
export default class MultiRemote {
    constructor () {
        this.instances = {}
    }

    /**
     * add instance to multibrowser instance
     */
    async addInstance (browserName, client) {
        if (this.instances[browserName]) {
            throw new Error(`webdriver instance "${browserName}" is already defined`)
        }
        this.instances[browserName] = await client
        return this.instances[browserName]
    }

    /**
     * modifier for multibrowser instance
     */
    modifier (wrapperClient) {
        const propertiesObject = {}
        propertiesObject.commandList = { value: wrapperClient.commandList }
        propertiesObject.options = { value: wrapperClient.options }

        for (const commandName of wrapperClient.commandList) {
            propertiesObject[commandName] = { value: this.commandWrapper(commandName) }
        }

        const client = Object.create({}, propertiesObject)

        /**
         * attach instances to wrapper client
         */
        for (const [identifier, instance] of Object.entries(this.instances)) {
            client[identifier] = instance
        }

        return client
    }

    commandWrapper (commandName) {
        const instances = this.instances
        return function (...args) {
            return Promise.all(
                Object.entries(instances).map(([, instance]) => instance[commandName](...args))
            )
        }
    }
}

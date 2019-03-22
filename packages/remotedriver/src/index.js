import RemoteDriver from './remotedriver'

const driver = new RemoteDriver()

export default function (_, __, commandInfo) {
    return driver.register(commandInfo)
}

import debug from './debug.js'

const browserCommands = [debug]
export default browserCommands.reduce((commands, fn) => {
    commands[fn.name] = { value: fn }
    return commands
}, {} as Record<string, PropertyDescriptor>)

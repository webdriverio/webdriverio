import { vi } from 'vitest'
import * as path from 'node:path'

const command: Record<string, unknown> = {}
command.name = vi.fn().mockReturnValue(command)
command.version = vi.fn().mockReturnValue(command)
command.usage = vi.fn().mockReturnValue(command)
command.arguments = vi.fn().mockReturnValue(command)
command.action = vi.fn((cb) => {
    cb(`${path.sep}foo${path.sep}bar${path.sep}someProjectName`)
    return command
})
command.option = vi.fn().mockReturnValue(command)
command.allowUnknownOption = vi.fn().mockReturnValue(command)
command.on = vi.fn().mockReturnValue(command)
command.parse = vi.fn().mockReturnValue(command)
command.opts = vi.fn().mockReturnValue('foobar')

export const Command = vi.fn().mockReturnValue(command)

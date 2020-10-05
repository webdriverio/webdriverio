import { join as pathJoin } from 'path'
import { promisify } from 'util'
import { readFile as readFileCb, writeFile as writeFileCb, unlink  } from 'fs'

export const readFile = promisify(readFileCb)
export const writeFile = promisify(writeFileCb)
export const deleteFile = promisify(unlink)

export const getPidPath = (pid: number) => pathJoin(__dirname, `/${pid}.pid`)

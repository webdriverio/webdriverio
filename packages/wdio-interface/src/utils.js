import isCI from 'is-ci'

export const isInteractive = process.stdout.isTTY && process.env.TERM !== 'dumb' && !isCI

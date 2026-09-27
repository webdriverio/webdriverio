#!/usr/bin/env node
import { runSessionCli } from '../build/index.js'

process.exitCode = await runSessionCli(process.argv.slice(2))

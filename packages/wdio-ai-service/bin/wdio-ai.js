#!/usr/bin/env node
import { runCli } from '../build/cli.js'

process.exitCode = await runCli(process.argv.slice(2))

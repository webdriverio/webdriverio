import fs from 'fs'
import log from 'loglevel'
import util from 'util'
import chalk from 'chalk'
import prefix from 'loglevel-plugin-prefix'

const DEFAULT_LEVEL = process.env.DEBUG ? 0 : 5 // silent
const COLORS = {
    error: 'red',
    warn: 'yellow',
    info: 'cyanBright',
    debug: 'green',
    trace: 'cyan'
}

const SERIALIZERS = [{
    /**
     * display error stack
     */
    matches: (err) => err instanceof Error,
    serialize: (err) => err.stack
}, {
    /**
     * color commands blue
     */
    matches: (log) => log === 'COMMAND',
    serialize: (log) => chalk.magenta(log)
}, {
    /**
     * color data yellow
     */
    matches: (log) => log === 'DATA',
    serialize: (log) => chalk.yellow(log)
}, {
    /**
     * color result cyan
     */
    matches: (log) => log === 'RESULT',
    serialize: (log) => chalk.cyan(log)
}]

/**
 * write to log file instead of stdout
 */
if (process.env.WDIO_LOG_PATH) {
    const logFile = fs.createWriteStream(process.env.WDIO_LOG_PATH)
    log.methodFactory = () => {
        return (...args) => {
            logFile.write(`${util.format.apply(this, args)}\n`)
        }
    }
}

prefix.apply(log, {
    template: '%t %l %n:',
    timestampFormatter: function (date) { return chalk.gray(date.toISOString()) },
    levelFormatter: function (level) { return chalk[COLORS[level]](level.toUpperCase()) },
    nameFormatter: function (name) { return chalk.whiteBright(name || 'global') }
});

const loggers = {}

export default function getLogger (name) {
    /**
     * check if logger was already initiated
     */
    if (loggers[name]) {
        return loggers[name]
    }

    const originalFactory = log.methodFactory;
    log.methodFactory = function (methodName, logLevel, loggerName) {
        const rawMethod = originalFactory(methodName, logLevel, loggerName);
        return function (...args) {
            args = args.map((arg) => {
                for (const s of SERIALIZERS) {
                    if (s.matches(arg)) {
                        return s.serialize(arg)
                    }
                }
                return arg
            })
            rawMethod(...args)
        };
    };

    loggers[name] = log.getLogger(name)
    loggers[name].setLevel(process.env.WDIO_LOG_LEVEL || DEFAULT_LEVEL)
    return loggers[name]
}

getLogger.setLevel = function (name, level) {
    loggers[name].setLevel(level)
}

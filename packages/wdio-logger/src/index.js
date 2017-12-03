import log from 'loglevel'
import chalk from 'chalk'
import prefix from 'loglevel-plugin-prefix'

const COLORS = {
    error: 'red',
    warn: 'yellow',
    info: 'cyanBright',
    debug: 'magenta',
    trace: 'cyan'
}

const SERIALIZERS = [{
    matches: (err) => err instanceof Error,
    serialize: (err) => err.stack
}]

prefix.apply(log, {
    template: '%t %l %n:',
    timestampFormatter: function (date) { return chalk.gray(date.toISOString()) },
    levelFormatter: function (level) { return chalk[COLORS[level]](level.toUpperCase()) },
    nameFormatter: function (name) { return chalk.whiteBright(name || 'global') }
});

export default function getLogger (name) {
    const originalFactory = log.methodFactory;
    log.methodFactory = function (methodName, logLevel, loggerName) {
        const rawMethod = originalFactory(methodName, logLevel, loggerName);
        return function (...args) {
            args = args.map((arg) => {
                for (const s of SERIALIZERS) {
                    if (s.matches(arg)) {
                        return s.serialize(arg)
                    }
                    return arg
                }
            })
            rawMethod(...args)
        };
    };
    log.setLevel(log.getLevel())
    return log.getLogger(name)
}

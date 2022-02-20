import path from 'path'
import glob from 'glob'

// Get all the matches in the expect-webdriverio package based on filenames
const expectPath  = require.resolve('expect-webdriverio')
const matchesGlob = path.resolve(expectPath, '../../lib/matchers/**')
const matchers    = glob.sync(matchesGlob, { nodir: true,  }).map(file => path.basename(file).replace(/(\.js|\.ts)/, ''))

const rule: any = {
    meta : {
        type : 'problem',
        docs : {
            description : 'expect must be prefixed with await',
            category    : 'Possible Errors',
            url         : 'https://github.com/webdriverio/packages/eslint-plugin-wdio/docs/rules/await-expect.md',
            recommended : false,
        },
        messages : {
            missingAwait : 'Missing await before an expect statement'
        },
        hasSuggestions : true
    },

    create : function(context: any) {
        return {
            MemberExpression(node: any): void {
                const object     = node.object?.callee?.name
                const property   = node.property?.name
                const parentType = node?.parent?.parent?.type ?? false

                if (object === 'expect' && matchers.includes(property) && parentType !== 'AwaitExpression') {
                    context.report({
                        node,
                        messageId : 'missingAwait',
                    })
                }
            }
        }
    }
}

export default rule

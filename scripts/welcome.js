import chalk from 'chalk'
import sh from 'shelljs'

const orange = chalk.hex('#ea5906')
const urlToDocs = process.env.IS_DEVCONTAINER
    ? `https://${process.env.CODESPACE_NAME || 'locahost'}-${3000}.preview.app.github.dev`
    : await sh.exec('gp url 3000')

const urlToCoverage = process.env.IS_DEVCONTAINER
    ? `https://${process.env.CODESPACE_NAME || 'locahost'}-${8000}.githubpreview.dev`
    : await sh.exec('gp url 8000')

const robot = `
                   .::::::::::::::::::::::::::.
                  .=                          =.
                  .-                          ::
               -+=.-    -====-.     -====-    ::-+-
              ***=.-   +-****==    +=****-+ :-::=***.
             .***=.-   =-****==    +=****-+ :-::=***.
              :+*=.-    --===-      -===--    ::=*+:
                   =.                        .=
                    .::::::::::::::::::::::::.
             -+************************************+-
           .-****=.                             =****-.
       .-=-::****                                ****-:-=-.
     .==    .**** = =.-::-                       ****:    -=
    .+.    .-****================================****=.    .+.
    +.   :**********************************************:   .*
    *   .**::****************************************::**:   *.
    *   -*- .****=***=*=++++****:................****: -*=   +.
    *   -*- .****-**===****+-***.                ****: -*=   +.
    *   -*- .****-*=+-******-***..=====-.   -+==+****: -*=   +.
    *   -*- .****-+=**-+***==***++.    .=+=+-    ****: -*=   +.
    *   -*- .****++****++++******-:::::::--::::::****: -*=   +.
    *   -*- .****************************************: -*=   +.
    *   -*- .****************************************: -*=   +.
   .*++++*= .****:::=++=:::-=++-:::::::::::::::::****: -**+++*.
  .********=.**** :-   .=.=:  =*=    -========-  ****:-********:
   +*******:.**** =  +- :-=  =: =    -========:  ****:.*******+
   = -=::-:-.****=.-:+=-- :-:.:-:    ====       -****:-:--:=: =
   + = =-=== =*****+***+++++***++++++++++++++++*****= ===-=.= +
   =:-+-       ...-=****:+..............+:****=-...       :+-.=
     .            :=****.+              =.****=-            ..
                  :=****.+              =:****=-
                  :=****:+              =-****=-
               :::==+++*=*              *=++++==:::
             =-        =..-            -..=        -=
            .*+++++++++++*=            =*+*+++++++++*.
            .***********+=:            :=+***********.
`

console.log(`
${orange(robot)}
${chalk.bold('     Welcome to the WebdriverIO Development Environment 👋')}

Thanks to GitHub Codespaces, everything is set-up and ready for you, so you can start making
changes to the package files and test them. There is a sample standalone script
you can run via:

${chalk.bold('$ node ./examples/standalone/sample.js')}

If you want to test changes for the testrunner (e.g. using Mocha), run:

${chalk.bold('$ cd ./examples/wdio')}
${chalk.bold('$ npm run test:mocha')}

The following environments are available for you:
    - Preview of the documentation page
      ${chalk.blue.bold(urlToDocs).trim()}

    - Code Coverage Overview
      ${chalk.blue.bold(urlToCoverage).trim()}

For more information, go to: ${chalk.blue.bold('https://webdriver.io/docs/contribute')}!

`)
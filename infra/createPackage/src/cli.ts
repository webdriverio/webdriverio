#!/usr/bin/env node
/**
 * This script generates new sub package with initial structure and files
 */

import inquirer from 'inquirer'

import { PACKAGE_TYPES } from './templates.js'
import { createPackage } from './index.js'

const { packageName, packageType } = await inquirer.prompt([{
    type: 'list',
    name: 'packageType',
    message: 'Select sub package type:',
    choices: PACKAGE_TYPES,
    default: 'reporter'
}, {
    type: 'input',
    name: 'packageName',
    message: 'Provide sub package name:'
}])

createPackage(packageName, packageType)

import { safeRequire } from '@wdio/utils'
import ConfigParser from './lib/ConfigParser'

/**
 * Loads the data providers from the files to memory
 * @param  {Object} dataProviderFilesPaths  List of files with data provider injections
 */
export function initializeDataProviders (dataProviderFilesPaths) {
    const dataProviderFiles =  ConfigParser.getFilePaths(dataProviderFilesPaths)
    const dataProvidersMap = {}
    let currentDataProviderFile = ''

    global.dataProvider = function (specFilePath, dataSet) {
        if (!Array.isArray(dataSet)) {
            throw new Error(`The data set passed from the file "${currentDataProviderFile}" for the spec file path "${specFilePath}" is not an array.`)
        }

        let specFiles =  ConfigParser.getFilePaths(specFilePath)
        specFiles.forEach((specFile) => {
            const specFileDataProvider = dataProvidersMap[specFile]
            if (typeof specFileDataProvider === 'undefined') {
                const dataProviderObject = {
                    'specFilePath': specFilePath,
                    'dataSet': dataSet,
                    'dataProviderFile': currentDataProviderFile
                }
                dataProvidersMap[specFile] = dataProviderObject
            } else {
                throw new Error(`With spec file path "${specFilePath}" in the data provider "${currentDataProviderFile}", you are attempting to override the data set already defined for it from data provider "${specFileDataProvider.dataProviderFile}". Please resolve conflict between these dataProvider functions.`)
            }
        })
    }

    for (let dpFile of dataProviderFiles) {
        currentDataProviderFile = dpFile
        safeRequire(dpFile)
    }

    delete global.dataProvider

    return dataProvidersMap
}

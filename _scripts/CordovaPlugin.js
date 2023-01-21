
// #region Imports
const { mkdir, writeFile } = require('fs/promises')
const fse = require('fs-extra')
const path = require('path')
const util = require('util')
const copy = util.promisify(fse.cp)
const exists = fse.existsSync
const { execWithLiveOutput } = require('./helpers')
// #endregion

class CordovaPlugin {
  apply(compiler) {
    compiler.hooks.afterDone.tap('CordovaPlugin', async (afterDone) => {
      const wwwRoot = afterDone.compilation.options.output.path
      const outputDirectory = path.join(wwwRoot, '..')
      const configXML = await require('../src/cordova/config.xml.js')
      const packageJSON = require('../src/cordova/package')

      if (!exists(path.join(outputDirectory, 'node_modules'))) {
        await writeFile(path.join(outputDirectory, 'package.json'), JSON.stringify(packageJSON, null, 2))
        await writeFile(path.join(outputDirectory, 'config.xml'), configXML.string)
        // Copy the icons into the cordova directory
        await mkdir(path.join(outputDirectory, 'res'))
        await mkdir(path.join(outputDirectory, 'res', 'icon'))
        await copy(path.join(__dirname, '..', '_icons', '.icon-set'), path.join(outputDirectory, 'res', 'icon', 'android'), { recursive: true, force: true })
        await copy(path.join(__dirname, '..', '_icons', 'icon.svg'), path.join(outputDirectory, 'res', 'icon', 'android', 'background.xml'))
        // These next commands require the environment to be development
        const environment = process.env.NODE_ENV
        process.env.NODE_ENV = 'development'
        // Install all of the cordova plugins
        await execWithLiveOutput(`cd ${outputDirectory} && yarn install`)
        // Restore the platform specific data
        await execWithLiveOutput(`cd ${outputDirectory} && yarn restore`)
        process.env.NODE_ENV = environment
      } else {
        await copy(path.join(__dirname, '..', '_icons', '.icon-set'), path.join(outputDirectory, 'res', 'icon', 'android'), { recursive: true, force: true })
        await copy(path.join(__dirname, '..', '_icons', 'icon.svg'), path.join(outputDirectory, 'res', 'icon', 'android', 'background.xml'))
      }
    })
  }
}

module.exports = CordovaPlugin

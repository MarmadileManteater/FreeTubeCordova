
;(async () => {
  // #region Imports
  const fs = require('fs')
  const fse = require('fs-extra')
  const path = require('path')
  const util = require('util')
  const exec = require('child_process').exec
  const writeFile = util.promisify(fs.writeFile)
  const mkdir = util.promisify(fs.mkdir)
  const rm = util.promisify(fse.rm)
  const exists = util.promisify(fs.exists)
  const copy = util.promisify(fse.cp)
  const configXML = await require('../src/cordova/config.xml.js')
  const packageJSON = require('../src/cordova/package')
  const execWithLiveOutput = (command) => {
    return new Promise((resolve, reject) => {
      let execCall = exec(command, (error, stdout, stderr) => {
        if (error) {
          reject(error)
        }
      })
      execCall.stdout.on('data', (data) => {
        process.stdout.write(data)
      })
      execCall.stderr.on('data', (data) => {
        console.error(data)
      })
      execCall.on('close', () => {
        resolve()
      })
    })
  }
  // #endregion
  const outputDirectory = path.join(__dirname, '..', 'dist', 'cordova')
  if (!(await exists(outputDirectory))) {
    await mkdir(outputDirectory)
    await writeFile(path.join(outputDirectory, 'package.json'), JSON.stringify(packageJSON, null, 2))
    await writeFile(path.join(outputDirectory, 'config.xml'), configXML.string)
    // Copy the icons into the cordova directory
    await mkdir(path.join(outputDirectory, 'res'))
    await mkdir(path.join(outputDirectory, 'res', 'icon'))
    await copy(path.join(__dirname, '..', '_icons', '.icon-set'), path.join(outputDirectory, 'res', 'icon', 'android'), { recursive: true, force: true })
    await copy(path.join(__dirname, '..', '_icons', 'icon.svg'), path.join(outputDirectory, 'res', 'icon', 'android', 'background.xml'))
    await copy(path.join(__dirname, '..', 'dist', 'web'), path.join(outputDirectory, 'www'), { recursive: true, force: true })
    // Install all of the cordova plugins
    await execWithLiveOutput(`cd ${outputDirectory} && yarn install`)
    // Restore the platform specific data
    await execWithLiveOutput(`cd ${outputDirectory} && yarn restore`)
  } else {
    await copy(path.join(__dirname, '..', 'dist', 'web'), path.join(outputDirectory, 'www'), { recursive: true, force: true })
  }
})()
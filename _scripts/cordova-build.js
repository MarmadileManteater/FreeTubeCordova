const { writeFile, copyFile, stat } = require('fs/promises')
const { move } = require('fs-extra')
const path = require('path')
const pkg = require('../package.json')
const exec = require('./helpers').execWithLiveOutput
;(async () => {
  const log = (message, level = 'INFO') => {
    // 🤷‍♀️ idk if there is a better way to implement logging here
    // eslint-disable-next-line
    console.log(`(${new Date().toISOString()})[${level}]: ${message}`)
  }
  const distDirectory = 'dist/cordova'
  try {
    await stat(distDirectory)
  } catch {
    log(`The dist directory \`${distDirectory}\` cannot be found. This build *will* fail. \`pack:cordova\` did not complete.`, 'WARN')
  }
  let apkName = `${pkg.name}-${pkg.version}.apk`
  let keystorePath = null
  let keystorePassphrase = null
  let release = false
  const args = Array.from(process.argv)
  if (args.indexOf('--release') !== -1) {
    release = true
    args.splice(args.indexOf('--release'), 1)
  }
  if (args.length > 2) {
    apkName = args[2]
  }
  if (args.length > 3) {
    keystorePath = args[3]
  }
  if (args.length > 4) {
    keystorePassphrase = args[4]
  }

  let buildArguments = ''
  if (keystorePassphrase !== null) {
    // the apk needs to be signed
    buildArguments = `--buildConfig --warning-mode-all ${release ? '--release' : ''}`
    await move(keystorePath, path.join(distDirectory, 'freetubecordova.keystore'))
    await writeFile(path.join(distDirectory, 'build.json'), JSON.stringify({
      android: {
        debug: {
          keystore: './freetubecordova.keystore',
          storePassword: keystorePassphrase,
          alias: 'freetubecordova',
          password: keystorePassphrase,
          keystoreType: 'jks'
        },
        release: {
          keystore: './freetubecordova.keystore',
          storePassword: keystorePassphrase,
          alias: 'freetubecordova',
          password: keystorePassphrase,
          keystoreType: 'jks'
        }
      }
    }, null, 4))
  }
  // 🏃‍♀️ Run the apk build
  log(`Building apk file for ${release ? 'release' : 'development'}`)
  await exec(`cd ${distDirectory} && npx cordova build android ${buildArguments}`)
  // 📋 Copy the apk to the build dir
  log('Copying apk file to build directory')
  await copyFile(path.join(distDirectory, 'platforms/android/app/build/outputs/apk/debug/app-debug.apk'), path.join(distDirectory, '..', apkName))
})()

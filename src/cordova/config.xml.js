
const pkg = require('../../package.json')
const fs = require('fs')
const util = require('util')
const xml2js = require('xml2js')
const parseXMLString = util.promisify(xml2js.parseString)
const createXMLStringFromObject = (obj) => {
  const builder = new xml2js.Builder()
  return builder.buildObject(obj)
}

module.exports = (async () => {
  const configXML = await parseXMLString((await util.promisify(fs.readFile)('./src/cordova/config.xml')).toString())
  configXML.widget.$.id = `io.freetubeapp.${pkg.name}`
  const versionParts = pkg.version.split('-')
  const [major, minor, patch] = versionParts[0].split('.')
  let build = 0
  if (versionParts.length > 2) {
    build = versionParts[2]
  }
  configXML.widget.$['android-versionCode'] = `${major * 10000000 + minor * 100000 + patch * 1000 + build}`
  configXML.widget.$.version = pkg.version
  configXML.widget.author[0].$.email = pkg.author.email
  configXML.widget.author[0]._ = pkg.author.name
  configXML.widget.author[0].$.href = pkg.author.url
  configXML.widget.name[0] = pkg.productName
  configXML.widget.description[0] = pkg.description
  const configXMLString = createXMLStringFromObject(configXML)
  return { string: configXMLString, object: configXML }
})()

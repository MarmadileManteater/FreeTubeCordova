
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
  configXML.widget.$.version = pkg.version
  configXML.widget.author[0].$.email = pkg.author.email
  configXML.widget.author[0]._ = pkg.author.name
  configXML.widget.author[0].$.href = pkg.author.url
  configXML.widget.name[0] = pkg.productName
  configXML.widget.description[0] = pkg.description
  const configXMLString = createXMLStringFromObject(configXML)
  return { string: configXMLString, object: configXML }
})()

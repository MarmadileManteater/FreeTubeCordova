import { readFile, writeFile } from '../src/renderer/helpers/android'

export function createInstance(kwargs) {
  return {
    async getItem(key) {
      const dataLocationFile = await readFile('data://', 'data-location.json')
      if (dataLocationFile !== '') {
        const locationInfo = JSON.parse(dataLocationFile)
        const locationMap = Object.fromEntries(locationInfo.files.map((file) => { return [file.fileName, file.uri] }))
        if (key in locationMap) {
          return await readFile(locationMap[key])
        }
      }
      const data = await readFile('data://', key)
      return data
    },
    async setItem(key, value) {
      const dataLocationFile = await readFile('data://', 'data-location.json')
      if (dataLocationFile !== '') {
        const locationInfo = JSON.parse(dataLocationFile)
        const locationMap = Object.fromEntries(locationInfo.files.map((file) => { return [file.fileName, file.uri] }))
        if (key in locationMap) {
          await writeFile(locationMap[key], value)
          return
        }
      }
      await writeFile('data://', key, value)
    }
  }
}

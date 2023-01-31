import cordova from 'cordova'

export const CHUNK_SIZE = 800000

/**
 * Takes a video URL and loads the data through OS level HTTP calls;
 * Calls back `onUpdate` with a new blobUrl every time a new chunk is loaded
 * @param {string} url the video to be proxied
 * @param {function} onUpdate a function which is called every time a new chunk is appended to the blob
 * @param {function} onError a function which is called as soon as there is an error (either retrieving data or appending it in memory)
 * @param {number} start the start index for leading the video data
 */
export async function proxyVideoThroughOS(url, onUpdate = () => { console.warn('no update function supplied!') }, onError = () => { console.warn('no error function supplied!') }, start = 0) {
  const { http } = cordova.plugin
  let blob, keepGoing, videoSize
  // the end is always 1 chunk after the start
  const end = () => start + CHUNK_SIZE - 1
  blob = new Blob()
  // Keep going until there is an error response
  // or the data ends
  keepGoing = true
  while (keepGoing) {
    await new Promise((resolve) => {
      http.sendRequest(url, {
        responseType: 'arraybuffer',
        headers: {
          Range: `bytes=${start}-${end()}`
        }
      }, ({ data, headers }) => {
        blob = new Blob([blob, new Uint8Array(data)])
        onUpdate({ blobUrl: URL.createObjectURL(blob) })
        const rangeParts = headers['content-range'].split('/')
        const endRange = parseInt(rangeParts[0].split('-')[1])
        if (!videoSize) {
          videoSize = parseInt(rangeParts[1])
        }
        if (endRange === videoSize - 1) {
          keepGoing = false
        }
        resolve()
      }, (response) => {
        keepGoing = false
        onError(response)
      })
    })
    start = end() + 1
  }
}

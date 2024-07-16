import android from 'android'

export const STATE_PLAYING = 3
export const STATE_PAUSED = 2
export const MIME_TYPES = {
  db: 'application/octet-stream',
  json: 'application/json',
  csv: 'text/comma-separated-values',
  opml: 'application/octet-stream',
  xml: 'text/xml'
}
export const FILE_TYPES = Object.fromEntries(Object.entries(MIME_TYPES).map(([key, value]) => [value, key]))

/**
 * @typedef SaveDialogResponse
 * @property {boolean} canceled
 * @property {'SUCCESS'|'USER_CANCELED'} type
 * @property {string?} uri
 * @property {string[]} filePaths
 */

/**
 * creates a new media session / or updates the previous one
 * @param {string} title
 * @param {string} artist
 * @param {number} duration
 * @param {string?} cover
 * @returns {Promise<void>}
 */
export function createMediaSession(title, artist, duration, cover = null) {
  android.createMediaSession(title, artist, duration, cover)
}

/**
 * Updates the current media session's state
 * @param {number} state the playback state, either `STATE_PAUSED` or `STATE_PLAYING`
 * @param {number?} position playback position in milliseconds
 */
export function updateMediaSessionState(state, position = null) {
  android.updateMediaSessionState(state?.toString() || null, position)
}

/**
 * Handles the response of a `requestDialog` function from the bridge
 * @param {string} promiseId
 * @returns {Promise<SaveDialogResponse>} either a uri based on the user's input or a cancelled response
 */
async function handleDialogResponse(promiseId) {
  // await the promise returned from the ☕ bridge
  let response = await window.awaitAsyncResult(promiseId)
  // handle case if user cancels prompt
  if (response === 'USER_CANCELED') {
    return {
      canceled: true,
      type: null,
      uri: null,
      filePaths: []
    }
  } else {
    response = JSON.parse(response)
    let typedUri = response?.uri
    if (response?.type in FILE_TYPES) {
      typedUri = `${typedUri}.${FILE_TYPES[response?.type]}`
    }
    return {
      canceled: false,
      type: 'SUCCESS',
      uri: response.uri,
      filePaths: [typedUri]
    }
  }
}

/**
 * Requests a save file dialog
 * @param {string} fileName name of requested file
 * @param {string} fileType mime type
 * @returns {Promise<SaveDialogResponse>} either a uri based on the user's input or a cancelled response
 */
export function requestSaveDialog(fileName, fileType) {
  // request a 💾save dialog
  const promiseId = android.requestSaveDialog(fileName, fileType)
  return handleDialogResponse(promiseId)
}

/**
 * Requests an open file dialog
 * @param {string[]} fileType mime type of acceptable inputs
 * @returns {Promise<SaveDialogResponse>} either a uri based on the user's input or a cancelled response
 */
export function requestOpenDialog(fileTypes) {
  const types = Array.from(new Set(fileTypes.map((type) => type in MIME_TYPES ? MIME_TYPES[type] : type)))

  // request a 🗄file open dialog
  const promiseId = android.requestOpenDialog(types.join(','))
  return handleDialogResponse(promiseId)
}

/**
 * @param {string} arg1 base uri or path
 * @param {string} arg2 path or content
 * @param {string?} arg3 content or undefined
 * @returns {Promise<boolean>} was able to successfully write?
 */
export async function writeFile(arg1, arg2, arg3 = undefined) {
  let baseUri, path, content
  if (arg3 === undefined) {
    baseUri = arg1
    path = ''
    content = arg2
  } else {
    baseUri = arg1
    path = arg2
    content = arg3
  }
  try {
    await window.awaitAsyncResult(android.writeFile(baseUri, path, content))
    return true
  } catch (exception) {
    console.error(exception)
    return false
  }
}

/**
 * a soft file read which returns '' if the file doesn't exist yet
 * @param {string} baseUri base of the uri
 * @param {string?} path (optional) path on top of base
 * @returns {Promise<string>} file contents or '' if no file was found
 */
export async function readFile(baseUri, path = '') {
  try {
    return await window.awaitAsyncResult(android.readFile(baseUri, path))
  } catch (exception) {
    console.warn(exception)
    return ''
  }
}

/**
 * @typedef ContentResultsInfo
 * @property {string} trimmedContent the original content, trimmed of whitespace
 * @property {boolean} startsLikeJson whether file content appears to be json-like
 * @property {boolean} startsLikeXml whether file content appears to be xml
 * @property {string} fileType the portion of the file path after the last dot
 * @property {boolean} reportsOpml whether or not the file type is 'opml'
 */

/**
 * @typedef ContentResults
 * @property {'db'|'opml'|string} type the determined real file type
 * @property {ContentResultsInfo} info the information which lead to this conclusion
 */

/**
 * detects the real file type of an `octet-stream` mime-typed file in android
 * @param {string} content
 * @param {string} filePath
 * @returns {ContentResults}
 */
export function detectAmbiguousContent(content, filePath) {
  const trimmedContent = content.trim()
  const startsLikeJson = trimmedContent[0] === '{'
  const startsLikeXml = trimmedContent[0] === '<'
  const fileType = filePath.slice(filePath.lastIndexOf('.'), filePath.length)
  const reportsOpml = fileType.endsWith('opml')
  const type = startsLikeJson && reportsOpml
    ? 'db'
    : startsLikeXml && reportsOpml
      ? 'opml'
      : fileType
  return {
    type,
    info: {
      trimmedContent,
      startsLikeJson,
      startsLikeXml,
      fileType,
      reportsOpml
    }
  }
}

/**
 * @param {string} filePath
 * @param {string} newFileType
 * @returns {string}
 */
export function replaceFileType(filePath, newFileType) {
  return `${filePath.slice(0, filePath.lastIndexOf('.'))}.${newFileType}`
}

/**
 *
 * @param {string} content
 * @param {string} filePath
 * @returns
 */
export function handleAmbigiousContent(content, filePath) {
  const { type, info } = detectAmbiguousContent(content, filePath)
  if (info.fileType !== type) {
    filePath = replaceFileType(filePath, type)
  }
  return filePath
}

/**
 * @typedef AndroidFile
 * @property {string} uri
 * @property {string} fileName
 */

/**
 * @callback CreateFile
 * @param {string} file name
 * @returns {string} content uri to file
 */

/**
 * @callback CreateDirectory
 * @param {string} directory name
 * @returns {DirectoryHandle} handle to directory
 */

/**
 * @callback ListFiles
 * @returns {Promise<Array<AndroidFile|DirectoryHandle>>}
 */

/**
 * @typedef DirectoryHandle
 * @property {boolean} canceled
 * @property {string?} uri
 * @property {CreateFile} createFile
 * @property {CreateDirectory} createDirectory
 * @property {ListFiles} listFiles
 */

/**
 *
 * @returns {Promise<DirectoryHandle>}
 */
export async function requestDirectory() {
  const uri = await window.awaitAsyncResult(android.requestDirectoryAccessDialog())
  if (uri === 'USER_CANCELED') {
    return {
      canceled: true
    }
  } else {
    return restoreHandleFromDirectoryUri(uri)
  }
}

/**
 *
 * @returns {Promise<DirectoryHandle>}
 */
export function restoreHandleFromDirectoryUri(uri) {
  return {
    uri,
    canceled: false,
    createFile(fileName) {
      return android.createFileInTree(uri, fileName)
    },
    createDirectory(dirName) {
      return restoreHandleFromDirectoryUri(android.createDirectoryInTree(uri, dirName))
    },
    async listFiles() {
      const files = await Promise.all(JSON.parse(android.listFilesInTree(uri)).map(async (file) => {
        if (file.isDirectory) {
          Object.assign(file, await restoreHandleFromDirectoryUri(file.uri))
        }
        return file
      }))
      return files
    }
  }
}

export async function getDownloadsDirectory() {
  const downloadsDirectory = JSON.parse(await readFile('data://', 'downloads-directory.json')).uri
  return await restoreHandleFromDirectoryUri(downloadsDirectory)
}

export async function getQueueDirectory() {
  const downloads = await getDownloadsDirectory()
  const files = await downloads.listFiles()
  const results = files.filter(file => file.fileName === 'queue')
  if (results.length > 0) {
    return results[0]
  }
}

export async function getVideosDirectory() {
  const downloads = await getDownloadsDirectory()
  const files = await downloads.listFiles()
  const results = files.filter(file => file.fileName === 'videos')
  if (results.length > 0) {
    return results[0]
  }
}

export async function getNestedUri(handle, path) {
  /** @type {Array<string>} */
  let parts = path.indexOf('/') !== -1 ? path.split('/') : [path]
  /** @type {DirectoryHandle} */
  let runningHandle = handle
  while (parts.length > 0) {
    const startingLength = parts.length
    const ls = await runningHandle.listFiles()
    for (const file in ls) {
      if (ls[file].fileName === parts[0]) {
        runningHandle = ls[file]
        parts = parts.slice(1)
      }
    }
    if (startingLength === parts.length) {
      throw new Error('Could not find path given')
    }
  }
  return runningHandle
}

export const EXPECTED_FILES = ['profiles.db', 'settings.db', 'history.db', 'playlists.db']

/**
 *
 * @param {DirectoryHandle} directoryHandle
 */
export async function initalizeDatabasesInDirectory(directoryHandle) {
  if (directoryHandle.canceled) {
    return []
  }
  const files = await directoryHandle.listFiles()
  const filteredFiles = files.filter(({ fileName }) => EXPECTED_FILES.indexOf(fileName) !== -1)
  const filteredFileNames = filteredFiles.map((item) => item.fileName)
  if (filteredFiles.length === EXPECTED_FILES.length) {
    // no changes necessary
  } else {
    const neededFiles = EXPECTED_FILES.filter((fileName) => filteredFileNames.indexOf(fileName) === -1)
    for (const file of neededFiles) {
      const fileData = {
        uri: directoryHandle.createFile(file),
        fileName: file
      }
      filteredFiles.push(fileData)
    }
  }
  return filteredFiles
}

export function isColourDark(colour) {
  if (colour.length < 7) {
    const char = colour.substring(1, 2)
    colour = `${colour.substring(0, 1)}${char}${char}${char}${char}${char}${char}`
  }
  const diffFromWhite = Math.abs(parseInt('FFFFFF', 16) - parseInt(colour.substring(1, colour.length), 16))
  const diffFromBlack = Math.abs(parseInt('000000', 16) - parseInt(colour.substring(1, colour.length), 16))
  return diffFromBlack > diffFromWhite
}

export function updateAndroidTheme(usesMain = false) {
  const bodyStyle = getComputedStyle(document.body)
  const isDark = isColourDark(bodyStyle.getPropertyValue('--primary-text-color'))
  const isDarkTop = usesMain ? isColourDark(bodyStyle.getPropertyValue('--text-with-main-color')) : isDark
  const top = !usesMain ? bodyStyle.getPropertyValue('--card-bg-color') : bodyStyle.getPropertyValue('--primary-color')
  const bottom = bodyStyle.getPropertyValue('--side-nav-color')
  android.themeSystemUi(bottom, top, isDark, isDarkTop)
}

export function getConsoleLogs() {
  return JSON.parse(android.getLogs())
}

export const EXPECTED_DATA_DIRS = ['authors', 'videos']

/**
 *
 * @param {DirectoryHandle} directoryHandle
 * @param {import('youtubei.js/dist/src/parser/misc').Format} videoFormat
 * @param {import('youtubei.js/dist/src/parser/misc').Format} audioFormat
 * @param {*} title
 * @param {*} videoId
 * @param {*} description
 * @param {*} likes
 * @param {*} viewCount
 * @param {*} published
 * @returns {Promise<string>}
 */
export async function downloadVideoAndAudio(directoryHandle, videoFormat, audioFormat, videoId, update = () => {}) {
  const files = await directoryHandle.listFiles()
  /** @type {DirectoryHandle} */
  let videoFolder
  const prexistingFolders = files.filter(file => file.isDirectory && file.fileName === videoId)
  if (prexistingFolders.length === 0) {
    videoFolder = directoryHandle.createDirectory(videoId)
  } else {
    videoFolder = prexistingFolders[0]
  }
  const videoMime = videoFormat.mime_type.split('video/')[1].split(';')[0]
  const audioMime = audioFormat.mime_type.split('audio/')[1].split(';')[0]
  const videoFileName = `video.${videoMime}`
  let alreadyExistingFiles = (await videoFolder.listFiles()).filter((file) => file.fileName === videoFileName)
  if (alreadyExistingFiles.length > 0) {
    android.deleteFileInTree(alreadyExistingFiles[0].uri)
  }
  const videoFile = videoFolder.createFile(videoFileName)
  await window.awaitAsyncResult(android.downloadChunkedStream(videoFormat.freeTubeUrl, videoFile), {
    log: [(log) => {
      const json = JSON.parse(log)
      update({
        stage: 'downloading video format',
        label: videoFormat.quality_label,
        ...json
      })
    }]
  })
  const audioFileName = `audio.${audioMime}`
  alreadyExistingFiles = (await videoFolder.listFiles()).filter((file) => file.fileName === audioFileName)
  if (alreadyExistingFiles.length > 0) {
    android.deleteFileInTree(alreadyExistingFiles[0].uri)
  }
  const audioFile = videoFolder.createFile(audioFileName)
  await window.awaitAsyncResult(android.downloadChunkedStream(audioFormat.freeTubeUrl, audioFile), {
    log: [(log) => {
      const json = JSON.parse(log)
      update({
        stage: 'downloading audio format',
        label: audioFormat.quality_label,
        ...json
      })
    }]
  })
  const outputFile = videoFolder.createFile(`output.${videoMime}`)
  const vSafParam = android.getASafUrl(videoFile, 'r')
  const aSafParam = android.getASafUrl(audioFile, 'r')
  const oSafParam = android.getASafUrl(outputFile, 'wt')
  await window.awaitAsyncResult(android.ffmpeg(`-i ${vSafParam} -i ${aSafParam} -c copy ${oSafParam}`),
    {
      log: [(message) => {
        update({
          stage: 'muxing streams with ffmpeg',
          message
        })
      }],
      stats: [(stats) => {
        update({
          stage: 'stats from ffmpeg',
          ...stats
        })
      }]
    })
  return outputFile
}

function getFormatInfo(format) {
  if ('mime_type' in format) {
    const [type, container] = format.mime_type.split(';')[0].split('/')

    return {
      type,
      container
    }
  } else {
    let type
    if ('audioChannels' in format) {
      // must be audio
      type = 'audio'
    } else {
      type = 'video'
    }
    let { container } = format
    if (container === 'm4a') {
      // for easier pairing of mp4 and m4a
      container = 'mp4'
    }
    return {
      type,
      container
    }
  }
}

/**
 * @typedef {import('./api/local').LocalFormat} LocalFormat
 */

/**
 * @typedef AudioVideo
 * @property {LocalFormat} audio
 * @property {LocalFormat?} video
 * @property {'mp4'|'webm'} container
 */

/**
 * @param {Array<LocalFormat>} formats
 * @returns {Array<AudioVideo>}
 */
export function getDownloadFormats(formats) {
  /** @type {Array<AudioVideo>} */
  const pairings = []
  const audioFormats = []
  const videoFormats = []
  // #region Seperate audio and video formats
  for (const format of formats) {
    const { type, container } = getFormatInfo(format)
    if (type === 'audio') {
      audioFormats.push(format)
      pairings.push({
        audio: format,
        container: container
      })
    } else if (type === 'video') {
      videoFormats.push(format)
    }
    // append info for later reuse
    format.__type = type
    format.__container = container
  }
  // #endregion
  const usedLabels = []
  for (const video of videoFormats) {
    const { container } = getFormatInfo(video)
    /** @type {AudioVideo} */
    const pairing = {
      video,
      container,
      qualityLabel: video?.quality_label || video?.qualityLabel,
      languageTracks: []
    }
    for (const audio of audioFormats) {
      const { __container } = audio
      if (!pairing.audio && __container === pairing.container && (audio.is_original || audio.audioChannels)) {
        pairing.audio = audio
        if (audio.audioChannels) {
          // if iv
          break
        }
      }
      if (__container === pairing.container && !audio.is_original) {
        pairing.languageTracks.push(audio)
      }
    }
    if (usedLabels.indexOf(pairing.qualityLabel) === -1) {
      usedLabels.push(pairing.qualityLabel)
      pairings.push(pairing)
    }
  }
  return pairings
}

export async function addToDownloadQueue(downloadRequest) {
  const downloadsDirectory = await getDownloadsDirectory()
  const files = await downloadsDirectory.listFiles()
  /** setting up queue */
  let queueDirectory = files.find(file => file.fileName === 'queue')
  if (!queueDirectory) {
    queueDirectory = downloadsDirectory.createDirectory('queue')
  }
  // write the request into a file which is timestamped
  downloadRequest.timestamp = new Date().getTime()
  const requestFileName = `${downloadRequest.timestamp}-${downloadRequest.videoData.id}.json`
  const requestFileUri = queueDirectory.createFile(requestFileName)
  await writeFile(requestFileUri, JSON.stringify(downloadRequest, null, 2))
  const event = new Event('add-to-download-queue')
  event.data = downloadRequest
  window.dispatchEvent(event)
}

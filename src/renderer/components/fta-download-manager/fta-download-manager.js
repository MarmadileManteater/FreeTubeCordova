import { defineComponent } from 'vue'
import { mapActions } from 'vuex'
import FtFlexBox from '../ft-flex-box/ft-flex-box.vue'
import FtPrompt from '../ft-prompt/ft-prompt.vue'
import FtButton from '../ft-button/ft-button.vue'
import FtaProgressBar from '../fta-progress-bar/fta-progress-bar.vue'
import { downloadVideoAndAudio, getDownloadsDirectory, getNestedUri, getQueueDirectory, getVideosDirectory, readFile, writeFile } from '../../helpers/android'
import { getRelativeTimeFromDate } from '../../helpers/utils'
import android from 'android'

export default defineComponent({
  name: 'FtaDownloadManager',
  components: {
    'ft-flex-box': FtFlexBox,
    'ft-prompt': FtPrompt,
    'ft-button': FtButton,
    'fta-progress-bar': FtaProgressBar
  },
  data() {
    return {
      queue: [],
      isWorking: false,
      currentProgress: 0,
      estimatedRemaingTime: Infinity
    }
  },
  computed: {
    shown() {
      return this.$store.getters.getShowDownloadManager
    },
    currentLocale: function () {
      return this.$i18n.locale.replace('_', '-')
    },
    queueReversed: function () {
      const result = []
      for (let i = this.queue.length - 1; i >= 0; i--) {
        result.push(this.queue[i])
      }
      return result
    }
  },
  async created() {
    await this.scanQueueDirectory()
    window.addEventListener('add-to-download-queue', this.addToDownloadQueue)
  },
  beforeDestroy() {
    this.queue = []
    window.removeEventListener('add-to-download-queue', this.addToDownloadQueue)
  },
  methods: {
    async work() {
      if (this.queue.length > 0 && !this.isWorking) {
        let timeStart = new Date().getTime()
        this.isWorking = true
        // something to work on
        const item = this.queue[0]
        /** @type {import('../../helpers/android').AudioVideo} */
        const format = item.format
        const videosDirectory = await getVideosDirectory()
        try {
          await downloadVideoAndAudio(videosDirectory, format.video, format.audio, item.videoData.id, (message) => {
            item.stage = message.stage
            if (!('messages' in item)) {
              item.messages = {}
            }
            if (!(message.stage in item.messages)) {
              item.messages[message.stage] = []
            }
            item.messages[message.stage].push(message.message)
            if ('progress' in message) {
              this.currentProgress = message.progress / message.contentLength
              const timeTaken = new Date().getTime() - timeStart
              const leftOverPercent = 1 - this.currentProgress
              const amountOfTimeTakenPerPercentagePoint = (timeTaken / this.currentProgress)
              const estimatedRemaingTime = amountOfTimeTakenPerPercentagePoint * leftOverPercent
              let seconds = Math.round((estimatedRemaingTime / 1000) % 60)
              let minutes = Math.round(((estimatedRemaingTime / 1000) / 60) % 60)
              const hours = Math.round((((estimatedRemaingTime / 1000) / 60) / 60))
              if (`${seconds}`.length < 2) {
                seconds = `0${seconds}`
              }
              if (`${minutes}`.length < 2) {
                minutes = `0${minutes}`
              }

              this.estimatedRemaingTime = `${hours}:${minutes}:${seconds}`
            }
          })
          const videoOutputDirectory = await getNestedUri(videosDirectory, item.videoData.id)
          const outputFiles = await videoOutputDirectory.listFiles()
          let output = null
          let video = null
          let audio = null
          for (const file in outputFiles) {
            if (outputFiles[file].fileName.startsWith('output')) {
              output = outputFiles[file]
            }
            if (outputFiles[file].fileName.startsWith('video')) {
              video = outputFiles[file]
            }
            if (outputFiles[file].fileName.startsWith('audio')) {
              audio = outputFiles[file]
            }
          }
          if (output !== null) {
            android.renameFile(output.uri, item.fileName)
          }
          // clean-up after ffmpeg
          if (video !== null) {
            android.deleteFileInTree(video.uri)
          }
          if (audio !== null) {
            android.deleteFileInTree(audio.uri)
          }
          const finishedOutput = await videoOutputDirectory.listFiles()
          if (finishedOutput.length > 0) {
            const data = item.videoData
            data.uri = finishedOutput[0].uri
            const jsonUri = videoOutputDirectory.createFile('data.json')
            await writeFile(jsonUri, JSON.stringify(data, null, 2))
          }
          this.queue = this.queue.slice(1)
          const queueDir = await getQueueDirectory()
          const files = await queueDir.listFiles()
          const originalQueueFiles = files.filter(file => file.fileName === `${item.timestamp}-${item.videoData.id}.json`)
          if (originalQueueFiles.length > 0) {
            android.deleteFileInTree(originalQueueFiles[0].uri)
          }
        } catch (ex) {
          console.error(ex)
          const videoOutputDirectory = await getNestedUri(videosDirectory, item.videoData.id)
          android.deleteFileInTree(videoOutputDirectory.uri)
        }
        this.isWorking = false
        if (this.queue.length > 0) {
          // todo put optional delay + recall work
          console.log('more work to do')
          this.work()
        }
      }
    },
    getRelativeTimeFromDate() {
      return getRelativeTimeFromDate(...arguments)
    },
    async scanQueueDirectory() {
      const dir = await getQueueDirectory()
      this.queue = (await Promise.all((await dir.listFiles()).map(async file => {
        const data = await readFile(file.uri)
        try {
          return JSON.parse(data)
        } catch (ex) {
          console.warn(`Error parsing JSON of file ${file.uri} for download queue:\r\n${ex}`)
          return undefined
        }
      }))).filter(queueItem => queueItem !== undefined)
    },
    async addToDownloadQueue({ data }) {
      this.queue.push(data)
      if (!this.isWorking) {
        this.work()
      }
    },
    ...mapActions([
      'showDownloadManager',
      'hideDownloadManager'
    ])
  }
})

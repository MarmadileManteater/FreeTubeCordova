import { defineComponent } from 'vue'
import { mapActions } from 'vuex'
import FtFlexBox from '../ft-flex-box/ft-flex-box.vue'
import FtPrompt from '../ft-prompt/ft-prompt.vue'
import FtButton from '../ft-button/ft-button.vue'
import { getQueueDirectory, readFile } from '../../helpers/android'
import { getRelativeTimeFromDate } from '../../helpers/utils'

export default defineComponent({
  name: 'FtaDownloadManager',
  components: {
    'ft-flex-box': FtFlexBox,
    'ft-prompt': FtPrompt,
    'ft-button': FtButton
  },
  data() {
    return {
      queue: []
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
  async mounted() {
    await this.scanQueueDirectory()
    window.addEventListener('add-to-download-queue', this.addToDownloadQueue)
  },
  beforeDestroy() {
    this.queue = []
    window.removeEventListener('add-to-download-queue', this.addToDownloadQueue)
  },
  methods: {
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
    },
    ...mapActions([
      'showDownloadManager',
      'hideDownloadManager'
    ])
  }
})

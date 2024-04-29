import { defineComponent } from 'vue'
import { Portal } from '@linusborg/vue-simple-portal'
import FtSelect from '../ft-select/ft-select.vue'
import FtInput from '../ft-input/ft-input.vue'
import FtButton from '../ft-button/ft-button.vue'

export default defineComponent({
  name: 'FtaAddDownloadPrompt',
  components: {
    portal: Portal,
    'ft-select': FtSelect,
    'ft-input': FtInput,
    'ft-button': FtButton
  },
  props: {
    sourcesForDownload: {
      type: Array,
      default: () => []
    },
    /** whether or not the dialog is currently visible */
    shown: {
      type: Boolean,
      default: () => false
    },
    /** a function which sets `shown` to `false` */
    hide: {
      type: Function,
      default: () => () => {}
    },
    suggestedTitle: {
      type: String,
      default: () => ''
    }
  },
  data: function () {
    return {
      formatSelected: -1
    }
  },
  computed: {
    audioVideoSources: function () {
      return this.sourcesForDownload.filter((source) => source.audio !== undefined).sort((a, b) => {
        // #region if one has a video and the other doesn't, bubble up the video
        if (!a.video && b.video) {
          return 1
        }
        if (!b.video && a.video) {
          return -1
        }
        // #endregion
        // #region if they both have the same media types, compare them directly
        if (a.video && b.video) {
          return parseInt(b.qualityLabel.split('p')[0]) - parseInt(a.qualityLabel.split('p')[0])
        }
        if (!a.video && !b.video) {
          return b.audio?.bitrate - a.audio?.bitrate
        }
        // #endregion
        // this case is impossible, but the linter doesn't know that
        // 🤫
        return 0
      })
    },
    /**
     * the names displayed in the format selector
     * @returns {Array<string>}
     */
    sourceNames: function () {
      return this.audioVideoSources.map(
        (source) => {
          return `${source.video?.qualityLabel || source.video?.quality_label || `${source.audio?.bitrate} kbps`} - ${source.video ? this.$t('Download Prompt.Video') : this.$t('Download Prompt.Audio')}`
        })
    },
    /**
     * the values used in the format selector
     * @returns {Array<number>}
     */
    sourceIds: function () {
      return [...Array(this.audioVideoSources.length).keys()]
    },
    /**
     * the placeholder title for the file
     * @returns {string}
     */
    placeholderTitle: function () {
      if (this.formatSelected !== -1) {
        return `${this.suggestedTitle}.${this.sourcesForDownload[this.formatSelected].container}`
      } else {
        return ''
      }
    }
  },
  watch: {
    shown(newVal) {
      // focusing an element changes scroll position,
      // so the position is restored right after the element is focused
      const top = window.scrollY
      if (newVal) {
        this.$refs.wrapper.focus()
      }
      // scroll to top when the dialog is closed
      window.scrollTo({
        top
      })
    }
  },
  methods: {
    addToDownload() {
    },
    updateFormatSelected(selected) {
      this.formatSelected = parseInt(selected)
    },
    onWrapperClick(e) {
      if (e.target === this.$refs.wrapper) {
        this.hide()
      }
    },
    keydown(e) {
      if (e.key === 'Escape') {
        this.hide()
      }
    },

  }
})

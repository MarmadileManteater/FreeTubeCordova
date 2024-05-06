import { defineComponent } from 'vue'
import FtSelect from '../ft-select/ft-select.vue'
import FtInput from '../ft-input/ft-input.vue'
import FtButton from '../ft-button/ft-button.vue'
import FtPrompt from '../ft-prompt/ft-prompt.vue'
import FtFlexBox from '../ft-flex-box/ft-flex-box.vue'

export default defineComponent({
  name: 'FtaAddDownloadPrompt',
  components: {
    'ft-select': FtSelect,
    'ft-input': FtInput,
    'ft-button': FtButton,
    'ft-prompt': FtPrompt,
    'ft-flex-box': FtFlexBox
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
      selected: -1
    }
  },
  computed: {
    formatSelected: {
      get: function () {
        if (this.selected === -1) {
          const quality = this.defaultQuality
          const sources = this.audioVideoSources
          for (let i = 0; i < sources.length; i++) {
            if (quality === parseInt(sources[i].qualityLabel.split('p')[0])) {
              return i
            }
          }
          return -1
        } else {
          return this.selected
        }
      },
      set: function (val) {
        this.selected = val
      }
    },
    defaultQuality: function () {
      const valueFromStore = this.$store.getters.getDefaultQuality
      if (valueFromStore === 'auto') { return valueFromStore }
      return parseInt(valueFromStore)
    },
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
        return `${this.suggestedTitle}.${this.audioVideoSources[this.formatSelected].container}`
      } else {
        return ''
      }
    }
  },
  methods: {
    addToDownload() {
    },
    updateFormatSelected(selected) {
      this.formatSelected = parseInt(selected)
    }
  }
})

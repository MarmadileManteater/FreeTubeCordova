import { defineComponent } from 'vue'
import FtSelect from '../ft-select/ft-select.vue'
import FtInput from '../ft-input/ft-input.vue'
import FtButton from '../ft-button/ft-button.vue'
import FtPrompt from '../ft-prompt/ft-prompt.vue'
import FtFlexBox from '../ft-flex-box/ft-flex-box.vue'
import { addToDownloadQueue } from '../../helpers/android'
import { showToast } from '../../helpers/utils'

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
    },
    videoData: {
      type: Object,
      required: true
    }
  },
  data: function () {
    return {
      fileName: '',
      selected: -1,
      captionSelected: -1,
      audioTrackSelected: -1
    }
  },
  computed: {
    formatSelected: {
      get: function () {
        if (this.selected === -1) {
          const quality = this.defaultQuality
          const sources = this.audioVideoSources
          for (let i = 0; i < sources.length; i++) {
            if (sources[i].video) {
              if (quality === parseInt(sources[i].qualityLabel.split('p')[0])) {
                return i
              }
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
          // bubble up original audio tracks
          // TODO: organise audio by language
          if (a.audio?.is_original && !b.audio?.is_original) {
            return -1
          }
          if (b.audio?.is_original && !a.audio?.is_original) {
            return 1
          }
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
          return `${source.video?.qualityLabel || source.video?.quality_label || `${source.audio?.language ? `${source.audio?.language} ` : ''}${source.audio?.bitrate} kbps`} - ${source.video ? this.$t('Download Prompt.Video') : this.$t('Download Prompt.Audio')}`
        })
    },
    /**
     * the values used in the format selector
     * @returns {Array<number>}
     */
    sourceIds: function () {
      return [...Array(this.audioVideoSources.length).keys()]
    },
    captions: function () {
      return this.sourcesForDownload.filter((source) => source.audio === undefined)
    },
    captionNames: function () {
      return ['', ...this.captions.map(caption => caption.label)]
    },
    captionIds: function() {
      return [-1, ...Array(this.captions.length).keys()]
    },
    hasMultipleAudioTracks: function () {
      if (!this.audioVideoSources[this.formatSelected]?.video) {
        return false
      }
      return this.audioVideoSources[this.formatSelected].languageTracks.length > 0
    },
    audioTracks: function () {
      if (!this.hasMultipleAudioTracks) {
        return []
      }
      return this.audioVideoSources[this.formatSelected].languageTracks
    },
    audioTrackNames: function () {
      if (!this.hasMultipleAudioTracks) {
        return []
      }
      return [`${this.audioVideoSources[this.formatSelected].audio.language} - ${this.audioVideoSources[this.formatSelected].audio.bitrate} kbps`, ...this.audioTracks.map(track => `${track.language} - ${track.bitrate} kbps`)]
    },
    audioTrackIds: function () {
      if (!this.hasMultipleAudioTracks) {
        return []
      }
      return [-1, ...Array(this.audioVideoSources[this.formatSelected].languageTracks.length).keys()]
    },
    /**
     * the placeholder title for the file
     * @returns {string}
     */
    placeholderTitle: function () {
      if (this.formatSelected !== -1) {
        return this.suggestedTitle
      } else {
        return ''
      }
    },
    container: function () {
      return this.formatSelected !== -1 ? `.${this.audioVideoSources[this.formatSelected].container}` : ''
    }
  },
  methods: {
    async addToDownload() {
      const downloadRequest = {
        videoData: this.videoData,
        format: this.audioVideoSources[this.formatSelected],
        captions: this.captions[this.captionSelected],
        // -1 means default to what is paired in formats
        languageTrackSelected: this.audioTrackSelected,
        fileName: `${(this.fileName !== '' ? this.fileName : this.placeholderTitle)}${this.container}`
      }
      await addToDownloadQueue(downloadRequest)
      showToast(this.$t('Download Prompt.Video has been added to download queue'))
      this.hide()
    },
    updateFormatSelected(selected) {
      this.formatSelected = parseInt(selected)
    },
    updateCaptionSelected(selected) {
      this.captionSelected = parseInt(selected)
    },
    updateAudioTrackSelected(selected) {
      this.audioTrackSelected = parseInt(selected)
    }
  }
})

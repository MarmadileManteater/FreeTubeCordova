import { defineComponent } from 'vue'
import { Portal } from '@linusborg/vue-simple-portal'

export default defineComponent({
  name: 'FtaAddDownloadPrompt',
  components: {
    portal: Portal
  },
  props: {
    sourcesForDownload: {
      type: Array,
      default: () => []
    },
    shown: {
      type: Boolean,
      default: () => false
    },
    hide: {
      type: Function,
      default: () => {}
    }
  },
  watch: {
    shown(newVal) {
      if (newVal) {
        this.$refs.wrapper.focus()
      }
    }
  },
  methods: {
    onWrapperClick(e) {
      if (e.target === this.$refs.wrapper) {
        this.hide()
      }
    },
    keydown(e) {
      if (e.key === 'Escape') {
        this.hide()
      }
    }
  }
})

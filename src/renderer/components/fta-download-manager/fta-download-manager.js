import { defineComponent } from 'vue'
import { mapActions } from 'vuex'
import FtFlexBox from '../ft-flex-box/ft-flex-box.vue'
import FtPrompt from '../ft-prompt/ft-prompt.vue'
import FtButton from '../ft-button/ft-button.vue'

export default defineComponent({
  name: 'FtaDownloadManager',
  components: {
    'ft-flex-box': FtFlexBox,
    'ft-prompt': FtPrompt,
    'ft-button': FtButton
  },
  computed: {
    shown() {
      return this.$store.getters.getShowDownloadManager
    }
  },
  methods: {
    ...mapActions([
      'showDownloadManager',
      'hideDownloadManager'
    ])
  }
})

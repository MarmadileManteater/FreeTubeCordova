
import { defineComponent } from 'vue'
import { mapActions } from 'vuex'
import FtSettingsSection from '../ft-settings-section/ft-settings-section.vue'
import FtToggleSwitch from '../ft-toggle-switch/ft-toggle-switch.vue'

export default defineComponent({
  name: 'CordovaSettings',
  components: {
    'ft-settings-section': FtSettingsSection,
    'ft-toggle-switch': FtToggleSwitch
  },
  computed: {
    getDisableBackgroundModeNotification: function () {
      return this.$store.getters.getDisableBackgroundModeNotification
    }
  },
  methods: {
    ...mapActions([
      'updateDisableBackgroundModeNotification',
    ])
  }
})

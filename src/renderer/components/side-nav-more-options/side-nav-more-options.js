import { defineComponent } from 'vue'
import { mapActions } from 'vuex'
import packageDetails from '../../../../package.json'

export default defineComponent({
  name: 'SideNav',
  data: function () {
    return {
      usingAndroid: process.env.IS_ANDROID,
      // release builds are the only ones with 3 periods in version numbers
      usingRelease: packageDetails.version.split('.').length - 1 === 3,
      openMoreOptions: false
    }
  },
  computed: {
    backendFallback: function () {
      return this.$store.getters.getBackendFallback
    },
    backendPreference: function () {
      return this.$store.getters.getBackendPreference
    },
    hidePopularVideos: function () {
      return this.$store.getters.getHidePopularVideos
    },
    hideTrendingVideos: function () {
      return this.$store.getters.getHideTrendingVideos
    },
    hideLabelsSideBar: function () {
      return this.$store.getters.getHideLabelsSideBar
    },
    applyNavIconExpand: function() {
      return {
        navIconExpand: this.hideLabelsSideBar
      }
    },
    downloadBehavior: function () {
      return this.$store.getters.getDownloadBehavior
    }
  },
  methods: {
    ...mapActions([
      'showLogViewer',
      'showDownloadManager'
    ])
  }
})

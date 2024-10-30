import { defineComponent } from 'vue'
import { mapActions } from 'vuex'

export default defineComponent({
  name: 'SideNav',
  data: function () {
    return {
      usingAndroid: process.env.IS_ANDROID,
      usingRelease: process.env.IS_RELEASE,
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
    }
  },
  methods: {
    ...mapActions([
      'showLogViewer'
    ])
  }
})

import { defineComponent } from 'vue'
import { mapActions } from 'vuex'
import FtFlexBox from '../ft-flex-box/ft-flex-box.vue'
import SideNavMoreOptions from '../side-nav-more-options/side-nav-more-options.vue'
import { youtubeImageUrlToInvidious } from '../../helpers/api/invidious'
import { deepCopy } from '../../helpers/utils'
import packageDetails from '../../../../package.json'

export default defineComponent({
  name: 'SideNav',
  components: {
    'ft-flex-box': FtFlexBox,
    'side-nav-more-options': SideNavMoreOptions
  },
  data() {
    return {
      usingAndroid: process.env.IS_ANDROID,
      // release builds are the only ones with 3 periods in version numbers
      usingRelease: packageDetails.version.split('.').length - 1 === 3,
    }
  },
  computed: {
    isOpen: function () {
      return this.$store.getters.getIsSideNavOpen
    },
    backendFallback: function () {
      return this.$store.getters.getBackendFallback
    },
    backendPreference: function () {
      return this.$store.getters.getBackendPreference
    },
    currentInvidiousInstance: function () {
      return this.$store.getters.getCurrentInvidiousInstance
    },
    profileList: function () {
      return this.$store.getters.getProfileList
    },
    activeProfile: function () {
      return this.$store.getters.getActiveProfile
    },
    locale: function () {
      return this.$i18n.locale.replace('_', '-')
    },
    activeSubscriptions: function () {
      const subscriptions = deepCopy(this.activeProfile.subscriptions)

      subscriptions.forEach(channel => {
        // Change thumbnail size to 35x35, as that's the size we display it
        // so we don't need to download a bigger image (the default is 176x176)
        channel.thumbnail = channel.thumbnail?.replace(/=s\d+/, '=s35')
      })

      subscriptions.sort((a, b) => {
        return a.name?.toLowerCase().localeCompare(b.name?.toLowerCase(), this.locale)
      })

      if (this.backendPreference === 'invidious') {
        subscriptions.forEach((channel) => {
          channel.thumbnail = youtubeImageUrlToInvidious(channel.thumbnail, this.currentInvidiousInstance)
        })
      }

      return subscriptions
    },
    hidePopularVideos: function () {
      return this.$store.getters.getHidePopularVideos
    },
    hidePlaylists: function () {
      return this.$store.getters.getHidePlaylists
    },
    hideTrendingVideos: function () {
      return this.$store.getters.getHideTrendingVideos
    },
    hideActiveSubscriptions: function () {
      return this.$store.getters.getHideActiveSubscriptions
    },
    hideLabelsSideBar: function () {
      return this.$store.getters.getHideLabelsSideBar
    },
    hideText: function () {
      return !this.isOpen && this.hideLabelsSideBar
    },
    applyNavIconExpand: function() {
      return {
        navIconExpand: this.hideText
      }
    },
    applyHiddenLabels: function() {
      return {
        hiddenLabels: this.hideText
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

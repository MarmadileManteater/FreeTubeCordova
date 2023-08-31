import { defineComponent } from 'vue'
import FtCard from '../../components/ft-card/ft-card.vue'
import packageDetails from '../../../../package.json'

export default defineComponent({
  name: 'About',
  components: {
    'ft-card': FtCard
  },
  data: function () {
    return {
      versionNumber: `v${packageDetails.version}`,
      chunks: [
        {
          icon: ['fab', 'github'],
          title: this.$t('About.Source code'),
          // For future reference, this is a change that is only for this repo.
          content: `<a href="https://github.com/MarmadileManteater/FreeTubeCordova">GitHub: FreeTubeCordova</a><br>${this.$t('About.Licensed under the AGPLv3')} <a href="https://www.gnu.org/licenses/agpl-3.0.en.html">${this.$t('About.View License')}</a>.<br/> This is a fork of the official <a href="https://github.com/FreeTubeApp/FreeTube">FreeTube</a> repo with modifications to work better in a browser and on phones.`
        },
        {
          icon: ['fas', 'file-download'],
          title: this.$t('About.Downloads / Changelog'),
          // This is never meant to be integrated back upstream, for obvious reasons.
          content: `<a href="https://github.com/MarmadileManteater/FreeTubeCordova/releases">${this.$t('About.GitHub releases')}</a>`
        },
        {
          icon: ['fas', 'question-circle'],
          title: this.$t('About.Help'),
          content: `<a href="https://docs.freetubeapp.io/">${this.$t('About.FreeTube Wiki')}</a> / <a href="https://docs.freetubeapp.io/faq/">${this.$t('About.FAQ')}</a> / <a href="https://github.com/FreeTubeApp/FreeTube/discussions/">${this.$t('About.Discussions')}</a>`
        },
        {
          icon: ['fas', 'exclamation-circle'],
          title: this.$t('About.Report a problem'),
          // This is never meant to be integrated back upstream, for obvious reasons.
          content: `<a href="https://github.com/MarmadileManteater/FreeTubeCordova/issues">${this.$t('About.GitHub issues')}</a><br>${this.$t('About.Please check for duplicates before posting')}`
        },
        {
          icon: ['fas', 'globe'],
          title: this.$t('About.Website'),
          content: '<a href="https://freetubeapp.io/">https://freetubeapp.io/</a>'
        },
        {
          icon: ['fas', 'newspaper'],
          title: this.$t('About.Blog'),
          content: '<a href="https://blog.freetubeapp.io">https://blog.freetubeapp.io</a>'
        },
        {
          icon: ['fas', 'envelope'],
          title: this.$t('About.Email'),
          content: '<a href="mailto:FreeTubeApp@protonmail.com">FreeTubeApp@protonmail.com</a>'
        },
        {
          icon: ['fab', 'mastodon'],
          title: this.$t('About.Mastodon'),
          content: '<a href="https://fosstodon.org/@FreeTube">@FreeTube@fosstodon.org</a>'
        },
        {
          icon: ['fas', 'comment-dots'],
          title: this.$t('About.Chat on Matrix'),
          content: `<a href="https://matrix.to/#/#freetube:matrix.org?via=matrix.org&via=privacytools.io&via=tchncs.de">#freetube:matrix.org</a><br>${this.$t('About.Please read the')} <a href="https://docs.freetubeapp.io/community/matrix/">${this.$t('About.room rules')}</a>`
        },
        {
          icon: ['fas', 'language'],
          title: this.$t('About.Translate'),
          content: '<a href="https://hosted.weblate.org/engage/free-tube/">https://hosted.weblate.org/engage/free-tube/</a>'
        },
        {
          icon: ['fas', 'users'],
          title: this.$t('About.Credits'),
          content: `${this.$t('About.FreeTube is made possible by')} <a href="https://docs.freetubeapp.io/credits/">${this.$t('About.these people and projects')}</a>`
        },
        {
          icon: ['fas', 'heart'],
          title: `${this.$t('About.Donate')} - Liberapay`,
          content: '<a href="https://liberapay.com/FreeTube">https://liberapay.com/FreeTube</a>'
        },
        {
          icon: ['fab', 'bitcoin'],
          title: `${this.$t('About.Donate')} - BTC`,
          content: '<a href="bitcoin:1Lih7Ho5gnxb1CwPD4o59ss78pwo2T91eS">1Lih7Ho5gnxb1CwPD4o59ss78pwo2T91eS</a>'
        },
        {
          icon: ['fab', 'monero'],
          title: `${this.$t('About.Donate')} - XMR`,
          content: '<a href="monero:48WyAPdjwc6VokeXACxSZCFeKEXBiYPV6GjfvBsfg4CrUJ95LLCQSfpM9pvNKy5GE5H4hNaw99P8RZyzmaU9kb1pD7kzhCB">48WyAPdjwc6VokeXACxSZCFeKEXBiYPV6GjfvBsfg4CrUJ95LLCQSfpM9pvNKy5GE5H4hNaw99P8RZyzmaU9kb1pD7kzhCB</a>'
        }
      ]
    }
  }
})

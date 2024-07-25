import { defineComponent } from 'vue'

export default defineComponent({
  name: 'FtaProgressBar',
  props: {
    filledAmount: {
      type: Number,
      required: true
    }
  },
  computed: {
    progressBarPercentage: function () {
      return this.filledAmount
    }
  }
})

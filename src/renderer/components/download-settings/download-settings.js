import { defineComponent } from 'vue'
import FtSettingsSection from '../ft-settings-section/ft-settings-section.vue'
import FtFlexBox from '../ft-flex-box/ft-flex-box.vue'
import FtToggleSwitch from '../ft-toggle-switch/ft-toggle-switch.vue'
import FtSelect from '../ft-select/ft-select.vue'
import FtButton from '../ft-button/ft-button.vue'
import FtInput from '../ft-input/ft-input.vue'
import { mapActions } from 'vuex'
import { IpcChannels } from '../../../constants'
import { EXPECTED_DATA_DIRS, readFile, requestDirectory, writeFile } from '../../helpers/android'

export default defineComponent({
  name: 'DownloadSettings',
  components: {
    'ft-settings-section': FtSettingsSection,
    'ft-toggle-switch': FtToggleSwitch,
    'ft-flex-box': FtFlexBox,
    'ft-select': FtSelect,
    'ft-button': FtButton,
    'ft-input': FtInput
  },
  data: function () {
    let downloadsDirectory = ''
    if (process.env.IS_ANDROID) {
      const json = readFile('data://', 'downloads-directory.json')
      if (json !== '') {
        downloadsDirectory = JSON.parse(json).uri
      }
    }
    return {
      downloadBehaviorValues: [
        'download',
        'open'
      ],
      downloadsDirectory
    }
  },
  computed: {
    usingElectron: function () {
      return process.env.IS_ELECTRON
    },
    usingAndroid: function () {
      return process.env.IS_ANDROID
    },
    downloadPath: function() {
      return this.$store.getters.getDownloadFolderPath
    },
    askForDownloadPath: function() {
      return this.$store.getters.getDownloadAskPath
    },
    downloadBehaviorNames: function () {
      return [
        this.$t('Settings.Download Settings.Download in app'),
        this.$t('Settings.Download Settings.Open in web browser')
      ]
    },
    downloadBehavior: function () {
      return this.$store.getters.getDownloadBehavior
    }
  },
  methods: {
    selectDownloadsDirectory: async function () {
      const directoryUris = []
      const downloadsDirectory = await requestDirectory()
      const files = downloadsDirectory.listFiles()
      const dirs = files.filter((file) => file.isDirectory && EXPECTED_DATA_DIRS.indexOf(file.fileName) !== -1)
      if (dirs.length !== EXPECTED_DATA_DIRS.length) {
        // something is missing
        const filesItHas = dirs.map(({ fileName }) => fileName)
        directoryUris.push(...dirs.map(({ uri }) => uri))
        const missingFiles = EXPECTED_DATA_DIRS.filter((name) => filesItHas.indexOf(name) === -1)
        for (const file of missingFiles) {
          const dir = downloadsDirectory.createDirectory(file)
          directoryUris.push(dir.uri)
        }
      }
      writeFile('data://', 'downloads-directory.json', JSON.stringify({
        uri: downloadsDirectory.uri,
        directories: directoryUris
      }))
      this.downloadsDirectory = downloadsDirectory.uri
    },
    handleDownloadingSettingChange: function (value) {
      this.updateDownloadAskPath(value)
    },
    chooseDownloadingFolder: async function () {
      if (process.env.IS_ELECTRON) {
        const { ipcRenderer } = require('electron')

        const folder = await ipcRenderer.invoke(
          IpcChannels.SHOW_OPEN_DIALOG,
          { properties: ['openDirectory'] }
        )

        if (folder.canceled) return

        this.updateDownloadFolderPath(folder.filePaths[0])
      }
    },
    ...mapActions([
      'updateDownloadAskPath',
      'updateDownloadFolderPath',
      'updateDownloadBehavior'
    ])
  }

})

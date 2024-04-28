<template>
  <ft-settings-section
    :title="$t('Settings.Download Settings.Download Settings')"
  >
    <ft-flex-box>
      <ft-select
        :placeholder="$t('Settings.Download Settings.Download Behavior')"
        :value="downloadBehavior"
        :select-names="downloadBehaviorNames"
        :select-values="downloadBehaviorValues"
        :icon="['fas', 'download']"
        @change="updateDownloadBehavior"
      />
    </ft-flex-box>
    <template
      v-if="downloadBehavior === 'download' && usingElectron"
    >
      <ft-flex-box
        class="settingsFlexStart500px"
      >
        <ft-toggle-switch
          :label="$t('Settings.Download Settings.Ask Download Path')"
          :default-value="askForDownloadPath"
          @change="handleDownloadingSettingChange"
        />
      </ft-flex-box>
      <template
        v-if="!askForDownloadPath"
      >
        <ft-flex-box>
          <ft-input
            class="folderDisplay"
            :placeholder="downloadPath"
            :show-action-button="false"
            :show-label="false"
            :disabled="true"
          />
        </ft-flex-box>
        <ft-flex-box>
          <ft-button
            :label="$t('Settings.Download Settings.Choose Path')"
            @click="chooseDownloadingFolder"
          />
        </ft-flex-box>
      </template>
    </template>
    <template
      v-if="downloadBehavior === 'download' && usingAndroid"
    >
      <br>
      <ft-flex-box>
        <ft-button
          :label="$t('Download Settings.Select Downloads Directory')"
          @click="selectDownloadsDirectory"
        />
      </ft-flex-box>
      <ft-flex-box>
        <p>
          {{ $t("Download Settings.Downloads Are Currently Stored In") }}
        </p>
        <p class="data-directory">
          {{ downloadsDirectory }}
        </p>
      </ft-flex-box>
    </template>
  </ft-settings-section>
</template>

<script src="./download-settings.js" />
<style scoped src="./download-settings.css" />

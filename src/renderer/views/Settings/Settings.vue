<template>
  <div class="settingsPage">
    <template v-if="unlocked">
      <ft-settings-menu
        v-show="isInDesktopView || settingsSectionTypeOpenInMobile == null"
        :settings-sections="settingsSectionComponents"
        @navigate-to-section="navigateToSection"
      />
      <div
        v-show="isInDesktopView || settingsSectionTypeOpenInMobile != null"
        class="settingsContent"
      >
        <div class="switchRow">
          <ft-toggle-switch
            class="settingsToggle"
            :label="$t('Settings.Sort Settings Sections (A-Z)')"
            :default-value="settingsSectionSortEnabled"
            :compact="false"
            @change="updateSettingsSectionSortEnabled"
          />
        </div>
        <div class="settingsSections">
          <template
            v-for="(settingsComponent) in settingsSectionComponents"
          >
            <component
              :is="settingsComponent.type"
              :ref="settingsComponent.type"
              :key="settingsComponent.type"
              :class="{ hideOnMobile: settingsSectionTypeOpenInMobile !== settingsComponent.type }"
              class="section"
            />
          </template>
        </div>
      </div>
    </template>
    <password-dialog
      v-else
      @unlocked="unlocked = true"
    />
  </div>
</template>

<script src="./Settings.js" />
<style scoped src="./Settings.css" />

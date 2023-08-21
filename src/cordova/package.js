const pkg = require('../../package.json')

module.exports = {
  name: pkg.name,
  displayName: pkg.productName,
  version: pkg.version,
  author: pkg.author,
  repository: pkg.repository,
  bugs: pkg.bugs,
  license: pkg.license,
  description: pkg.description,
  private: pkg.private,
  scripts: {
    restore: 'npx cordova platform add android'
  },
  devDependencies: {
    'cordova-android': '^12.0.0',
    'cordova-clipboard': '^1.3.0',
    'cordova-plugin-background-mode': 'git+https://bitbucket.org/TheBosZ/cordova-plugin-run-in-background.git',
    'cordova-plugin-android-permissions': '^1.1.4',
    'cordova-plugin-music-controls2': '3.0.7',
    'cordova-plugin-save-dialog': '^1.1.1',
    'cordova-plugin-theme-detection': '^1.3.0',
    'cordova-plugin-device': '^2.1.0',
    'cordova-plugin-advanced-http': '^3.3.1',
    'cordova-universal-links-fix-plugin': '^1.2.7'
  },
  cordova: {
    platforms: [
      'android'
    ],
    plugins: {
      'cordova-plugin-android-permissions': {},
      'cordova-plugin-music-controls2': {},
      'cordova-clipboard': {},
      'cordova-plugin-background-mode': {},
      'cordova-plugin-theme-detection': {},
      'cordova-plugin-save-dialog': {},
      'cordova-plugin-advanced-http': {},
      'cordova-universal-links-fix-plugin': {}
    }
  }
}

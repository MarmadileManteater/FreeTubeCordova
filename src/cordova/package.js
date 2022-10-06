
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
    'cordova-clipboard': '^1.3.0',
    'cordova-plugin-advanced-background-mode': '^1.1.1',
    'cordova-plugin-android-permissions': '^1.1.4',
    'cordova-plugin-music-controls2': 'github:ghenry22/cordova-plugin-music-controls2',
    'cordova-plugin-theme-detection': '^1.3.0'
  },
  cordova: {
    platforms: [
      'android'
    ],
    plugins: {
      'cordova-plugin-android-permissions': {},
      'cordova-plugin-music-controls2': {},
      'cordova-clipboard': {},
      'cordova-plugin-advanced-background-mode': {},
      'cordova-plugin-theme-detection': {}
    }
  }
}

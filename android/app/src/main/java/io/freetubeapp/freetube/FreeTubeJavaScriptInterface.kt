package io.freetubeapp.freetube

import android.annotation.SuppressLint
import android.app.Activity
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Intent
import android.graphics.BitmapFactory
import android.graphics.Color
import android.media.MediaMetadata
import android.media.session.MediaSession
import android.media.session.PlaybackState
import android.media.session.PlaybackState.STATE_PAUSED
import android.net.Uri
import android.os.Build
import android.provider.OpenableColumns
import android.view.WindowManager
import android.webkit.JavascriptInterface
import androidx.activity.result.ActivityResult
import androidx.annotation.RequiresApi
import androidx.core.app.NotificationManagerCompat
import androidx.core.view.WindowCompat
import androidx.documentfile.provider.DocumentFile
import org.json.JSONObject
import java.io.File
import java.io.FileInputStream
import java.net.URL
import java.net.URLDecoder
import java.util.UUID.*


class FreeTubeJavaScriptInterface {
  private var context: MainActivity
  private var mediaSession: MediaSession?
  private var lastPosition: Long
  private var lastState: Int
  private var lastNotification: Notification? = null
  private var keepScreenOn: Boolean = false
  var syncMessages: MutableMap<String, String> = HashMap()

  companion object {
    private const val DATA_DIRECTORY = "data://"
    private const val CHANNEL_ID = "media_controls"
    private val NOTIFICATION_ID = (2..1000).random()
    private val NOTIFICATION_TAG = String.format("%s", randomUUID())
  }

  constructor(main: MainActivity) {
    context = main
    mediaSession = null
    lastPosition = 0
    lastState = PlaybackState.STATE_PLAYING
  }

  @JavascriptInterface
  fun getLogs(): String {
    var logs = "["
    for (message in context.consoleMessages) {
      logs += "${message},"
    }
    // get rid of trailing comma
    logs = logs.substring(0, logs.length - 1)
    logs += "]"
    return logs
  }

  /**
   * @param directory a shortened directory uri
   * @return a full directory uri
   */
  @JavascriptInterface
  fun getDirectory(directory: String): String {
    val path =  if (directory == DATA_DIRECTORY) {
      // this is the directory cordova gave us access to before
      context.getExternalFilesDir(null)!!.parent
    } else {
      directory
    }
    return path
  }

  /**
   * retrieves actions for the media controls
   * @param state the current state of the media controls (ex PlaybackState.STATE_PLAYING or PlaybackState.STATE_PAUSED
   */
  private fun getActions(state: Int = lastState): Array<Notification.Action> {
    var neutralAction = arrayOf("Pause", "pause")
    var neutralIcon = androidx.media3.ui.R.drawable.exo_icon_pause
    if (state == PlaybackState.STATE_PAUSED) {
      neutralAction = arrayOf("Play", "play")
      neutralIcon = androidx.media3.ui.R.drawable.exo_icon_play
    }
    return arrayOf(
      Notification.Action.Builder(
        androidx.media3.ui.R.drawable.exo_ic_skip_previous,
        "Back",
        PendingIntent.getBroadcast(context, 1, Intent(context, MediaControlsReceiver::class.java).setAction("previous"), PendingIntent.FLAG_IMMUTABLE)
      ).build(),
      Notification.Action.Builder(
        neutralIcon,
        neutralAction[0],
        PendingIntent.getBroadcast(context, 1, Intent(context, MediaControlsReceiver::class.java).setAction(neutralAction[1]), PendingIntent.FLAG_IMMUTABLE)
      ).build(),
      Notification.Action.Builder(
        androidx.media3.ui.R.drawable.exo_ic_skip_next,
        "Next",
        PendingIntent.getBroadcast(context, 1, Intent(context, MediaControlsReceiver::class.java).setAction("next"), PendingIntent.FLAG_IMMUTABLE)
      ).build()
    )
  }

  /**
   * retrieves the media style for the media controls notification
   */
  private fun getMediaStyle(): Notification.MediaStyle? {
    if (mediaSession != null) {
      return Notification.MediaStyle()
        .setMediaSession(mediaSession!!.sessionToken).setShowActionsInCompactView(0, 1, 2)
    } else {
      return null
    }
  }

  /**
   * Gets a fresh media controls notification given the current `mediaSession`
   * @param actions a list of actions for the media controls (defaults to `getActions()`)
   */
  @RequiresApi(Build.VERSION_CODES.O)
  private fun getMediaControlsNotification(actions: Array<Notification.Action> = getActions()): Notification? {
    val mediaStyle = getMediaStyle()
    if (mediaStyle != null) {
      // when clicking the notification, launch the app as if the user tapped on it in their launcher (open an existing instance if able)
      val notificationIntent = Intent(Intent.ACTION_MAIN)
        .addCategory(Intent.CATEGORY_LAUNCHER)
        .setClass(context,  MainActivity::class.java)

      // always reuse notification
      if (lastNotification != null) {
        lastNotification!!.actions = actions
        return lastNotification
      }
      lastNotification = Notification.Builder(context, CHANNEL_ID)
        .setStyle(getMediaStyle())
        .setSmallIcon(R.drawable.ic_media_notification_icon)
        .addAction(
          actions[0]
        )
        .addAction(
          actions[1]
        )
        .addAction(
          actions[2]
        )
        .setContentIntent(
          PendingIntent.getActivity(
            context, 1, notificationIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
          )
        )
        .setDeleteIntent(
          PendingIntent.getBroadcast(context, 1, Intent(context, MediaControlsReceiver::class.java).setAction("pause"), PendingIntent.FLAG_IMMUTABLE)
        )
        .setVisibility(Notification.VISIBILITY_PUBLIC)
        .build()
      return lastNotification
    } else {
      return null
    }
  }

  /**
   * pushes a notification
   * @param notification the notification the be pushed (usually a media controls notification)
   */
  @SuppressLint("MissingPermission")
  private fun pushNotification(notification: Notification) {
    if (lastNotification !== null && Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
      // always set notifications to pause before sending another on android 13+
      setState(mediaSession!!, STATE_PAUSED)
    }
    val manager = NotificationManagerCompat.from(context)
    manager.notify(NOTIFICATION_TAG, NOTIFICATION_ID, notification)
  }

  /**
   * sets the state of the media session
   * @param session the current media session
   * @param state the state of playback
   * @param position the position in milliseconds of playback
   */
  @SuppressLint("MissingPermission")
  private fun setState(session: MediaSession, state: Int, position: Long? = null) {

    if (state != lastState) {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU) {
        // need to reissue a notification if we want to update the actions
        var actions = getActions(state)
        val notification = getMediaControlsNotification(actions)
        pushNotification(notification!!)
      }
    }
    lastState = state
    var statePosition: Long
    if (position == null) {
      statePosition = lastPosition
    } else {
      statePosition = position
    }
    session.setPlaybackState(
      PlaybackState.Builder()
        .setState(state, statePosition, 0.0f)
        .setActions(PlaybackState.ACTION_PLAY_PAUSE or PlaybackState.ACTION_PAUSE or PlaybackState.ACTION_SKIP_TO_NEXT or PlaybackState.ACTION_SKIP_TO_PREVIOUS or
        PlaybackState.ACTION_PLAY_FROM_MEDIA_ID or
        PlaybackState.ACTION_PLAY_FROM_SEARCH or PlaybackState.ACTION_SEEK_TO)
        .build()
    )
  }

  /**
   * sets the metadata of the media session
   * @param session the current media session
   * @param trackName the video name
   * @param artist the channel name
   * @param duration duration in milliseconds
   */
  @SuppressLint("MissingPermission")
  @RequiresApi(Build.VERSION_CODES.O)
  private fun setMetadata(session: MediaSession, trackName: String, artist: String, duration: Long, art: String?, pushNotification: Boolean = true) {
    var notification: Notification? = null
    if (pushNotification) {
      notification = getMediaControlsNotification()
    }

    if (art != null) {
      // todo move this to a function and add try catch
      val connection = URL(art).openConnection()
      connection.connect()
      val input = connection.getInputStream()
      val bitmapArt = BitmapFactory.decodeStream(input)
      // todo
      session.setMetadata(
        MediaMetadata.Builder()
          .putString(MediaMetadata.METADATA_KEY_TITLE, trackName)
          .putString(MediaMetadata.METADATA_KEY_ARTIST, artist)
          .putBitmap(MediaMetadata.METADATA_KEY_ART, bitmapArt)
          .putBitmap(MediaMetadata.METADATA_KEY_ALBUM_ART, bitmapArt)
          .putLong(MediaMetadata.METADATA_KEY_DURATION, duration)
          .build()
      )
    } else {
      session.setMetadata(
        MediaMetadata.Builder()
          .putString(MediaMetadata.METADATA_KEY_TITLE, trackName)
          .putString(MediaMetadata.METADATA_KEY_ARTIST, artist)
          .putLong(MediaMetadata.METADATA_KEY_DURATION, duration)
          .build()
      )
    }
    if (pushNotification && notification != null) {
      pushNotification(notification)
    }
  }

  /**
   * creates (or updates) a media session
   * @param title the track name / video title
   * @param artist the author / channel name
   * @param duration the duration in milliseconds of the video
   * @param thumbnail a URL to the thumbnail for the video
   */
  @SuppressLint("MissingPermission")
  @RequiresApi(Build.VERSION_CODES.O)
  @JavascriptInterface
  fun createMediaSession(title: String, artist: String, duration: Long = 0, thumbnail: String? = null) {
    val notificationManager = NotificationManagerCompat.from(context)
    val channel = notificationManager.getNotificationChannel(CHANNEL_ID, "Media Controls")
      ?: NotificationChannel(CHANNEL_ID, "Media Controls", NotificationManager.IMPORTANCE_MIN)

    channel.lockscreenVisibility = Notification.VISIBILITY_PRIVATE
    var session: MediaSession

    // don't create multiple sessions or multiple channels
    if (mediaSession == null) {
      notificationManager.createNotificationChannel(channel)
      // add the callbacks && listeners

      session = MediaSession(context, CHANNEL_ID)
      session.isActive = true
      mediaSession = session
      session.setCallback(object : MediaSession.Callback() {
        override fun onSkipToNext() {
          super.onSkipToNext()
          context.dispatchEvent("media-next")
        }

        override fun onSkipToPrevious() {
          super.onSkipToPrevious()
          context.dispatchEvent("media-previous")
        }

        override fun onSeekTo(pos: Long) {
          super.onSeekTo(pos)
          context.dispatchEvent("media-seek", "position", pos)
        }

        override fun onPlay() {
          super.onPlay()
          context.dispatchEvent("media-play")
        }

        override fun onPause() {
          super.onPause()
          context.dispatchEvent("media-pause")
        }

      })
    } else {
      session = mediaSession!!
    }

    val notification = getMediaControlsNotification()
    // use the set metadata function without pushing a notification
    setMetadata(session, title, artist, duration, thumbnail, false)
    setState(session, PlaybackState.STATE_PLAYING)

    pushNotification(notification!!)
  }

  /**
   * updates the state of the active media session
   * @param state the state; should be an Int (as a string because the java bridge)
   * @param position the position; should be a Long (as a string because the java bridge)
   */
  @JavascriptInterface
  fun updateMediaSessionState(state: String?, position: String? = null) {
    var givenState = state?.toInt()
    if (state == null) {
      givenState = lastState
    } else {
    }
    if (position != null) {
      lastPosition = position.toLong()!!
    }
    setState(mediaSession!!, givenState!!, position?.toLong())
  }

  /**
   * updates the metadata of the active media session
   * @param trackName the video title
   * @param artist the channel name
   * @param duration the length of the video in milliseconds
   * @param art the URL to the video thumbnail
   */
  @SuppressLint("NewApi")
  @JavascriptInterface
  fun updateMediaSessionData(trackName: String, artist: String, duration: Long, art: String? = null) {
    setMetadata(mediaSession!!, trackName, artist, duration, art)
  }

  /**
   * cancels the active media notification
   */
  @JavascriptInterface
  fun cancelMediaNotification() {
    val manager = NotificationManagerCompat.from(context)
    manager.cancelAll()
  }

  /**
   * reads a file from storage
   */
  @JavascriptInterface
  fun readFile(basedir: String, filename: String): String {
    val promise = jsPromise()
    context.threadPoolExecutor.execute {
      try {
        if (basedir.startsWith("content://")) {
          val stream = context.contentResolver.openInputStream(Uri.parse(basedir))
          val content = String(stream!!.readBytes())
          stream!!.close()
          resolve(promise, content)
        } else {
          val path = getDirectory(basedir)
          val file = File(path, filename)
          resolve(promise, FileInputStream(file).bufferedReader().use { it.readText() })
        }
      } catch (ex: Exception) {
        reject(promise, ex.stackTraceToString())
      }
    }
    return promise
  }

  /**
   * writes a file to storage
   */
  @JavascriptInterface
  fun writeFile(basedir: String, filename: String, content: String): String {
    val promise = jsPromise()
    context.threadPoolExecutor.execute {
      try {
        if (basedir.startsWith("content://")) {
          // urls created by save dialog
          val stream = context.contentResolver.openOutputStream(Uri.parse(basedir), "wt")
          stream!!.write(content.toByteArray())
          stream!!.flush()
          stream!!.close()
          resolve(promise, "true")
        } else {
          val path = getDirectory(basedir)
          var file = File(path, filename)
          if (!file.exists()) {
            file.createNewFile()
          }
          file.writeText(content)
          resolve(promise, "true")
        }
      } catch (ex: Exception) {
        reject(promise, ex.stackTraceToString())
      }
    }
    return promise
  }

  /**
   * requests a save dialog, resolves a js promise when done, resolves with `USER_CANCELED` if the user cancels
   * @return a js promise id
   */
  @JavascriptInterface
  fun requestSaveDialog(fileName: String, fileType: String): String {
    val promise = jsPromise()
    val saveDialogIntent = Intent(Intent.ACTION_CREATE_DOCUMENT)
      .addCategory(Intent.CATEGORY_OPENABLE)
      .setType(fileType)
      .putExtra(Intent.EXTRA_TITLE, fileName)
    context.listenForActivityResults {
      result: ActivityResult? ->
      if (result!!.resultCode == Activity.RESULT_CANCELED) {
        resolve(promise, "USER_CANCELED")
      }
      try {
        val uri = result!!.data!!.data
        var stringUri =  uri.toString()
        // something about the java bridge url decodes all strings, so I am going to double encode this one
        resolve(promise, "{ \"uri\": \"$stringUri\" }")
      } catch (ex: Exception) {
        reject(promise, ex.toString())
      }
    }
    context.activityResultLauncher.launch(saveDialogIntent)
    return promise
  }

  @JavascriptInterface
  fun getFileNameFromUri(uri: String): String {
    var result: String? = null
    val cursor = context.contentResolver.query(Uri.parse(uri),  null, null, null, null)
    try {
      if (cursor != null && cursor.moveToFirst()) {
        val index = cursor.getColumnIndex(OpenableColumns.DISPLAY_NAME)
        if (index != -1) {
          result = cursor.getString(index)
        }
      }
    } finally {
      cursor!!.close()
    }

    if (result == null) {
      result = uri.split(Regex("(/)|(%2F)")).last()
    }

    return result
  }

  @JavascriptInterface
  fun requestOpenDialog(fileTypes: String): String {
    val promise = jsPromise()
    val openDialogIntent = Intent(Intent.ACTION_GET_CONTENT)
      .setType("*/*")
      .putExtra(Intent.EXTRA_MIME_TYPES, fileTypes.split(",").toTypedArray())

    context.listenForActivityResults {
        result: ActivityResult? ->
      if (result!!.resultCode == Activity.RESULT_CANCELED) {
        resolve(promise, "USER_CANCELED")
      }
      try {
        val uri = result!!.data!!.data
        var mimeType = context.contentResolver.getType(uri!!)
        val fileName = getFileNameFromUri(uri.toString())
        resolve(promise, "{ \"uri\": \"${uri}\", \"type\": \"${mimeType}\", \"fileName\": \"${fileName}\" }")
      } catch (ex: Exception) {
        reject(promise, ex.toString())
      }
    }
    context.activityResultLauncher.launch(openDialogIntent)
    return promise
  }

  @JavascriptInterface
  fun requestDirectoryAccessDialog(): String {
    val promise = jsPromise()
    val openDialogIntent = Intent(Intent.ACTION_OPEN_DOCUMENT_TREE)
    context.listenForActivityResults {
        result: ActivityResult? ->
      if (result!!.resultCode == Activity.RESULT_CANCELED) {
        resolve(promise, "USER_CANCELED")
      }
      try {
        val uri = result!!.data!!.data!!
        context.contentResolver.takePersistableUriPermission(
          uri,
          Intent.FLAG_GRANT_READ_URI_PERMISSION or Intent.FLAG_GRANT_WRITE_URI_PERMISSION
        )
        resolve(promise, uri.toString())
      } catch (ex: Exception) {
        reject(promise, ex.toString())
      }
    }
    context.activityResultLauncher.launch(openDialogIntent)
    return promise
  }

  private fun findTreeFileFromUri(uri: String): DocumentFile {
    val directory = DocumentFile.fromTreeUri(context, Uri.parse(uri))
    val parsedTreeUri = directory!!.uri.toString()
    if (parsedTreeUri != uri && uri.contains("%2F")) {
      val difference = uri.replace(parsedTreeUri, "")
      val path = URLDecoder.decode(difference, "utf-8")
      var subDirectories = path.split("/").filter { it != "" }
      var currentDirectory = directory!!
      while (subDirectories.isNotEmpty()) {
        // we need to navigate down the tree
        val files = currentDirectory.listFiles()
        val matchedSubDirectories = files.filter {
          it.name == subDirectories[0]
        }
        if (matchedSubDirectories.isNotEmpty()) {
          currentDirectory = matchedSubDirectories[0]
          subDirectories = subDirectories.subList(1, subDirectories.count())
        } else {
          throw Exception("File not found. :(")
        }
      }
      return currentDirectory!!
    }
    return directory!!
  }

  @JavascriptInterface
  fun revokePermissionForTree(treeUri: String) {
    context.revokeUriPermission(Uri.parse(treeUri), Intent.FLAG_GRANT_READ_URI_PERMISSION or Intent.FLAG_GRANT_WRITE_URI_PERMISSION)
  }

  @JavascriptInterface
  fun listFilesInTree(tree: String): String {
    val directory = findTreeFileFromUri(tree)
    val files = directory!!.listFiles().joinToString(",") { file ->
      "{ \"uri\": \"${file.uri}\", \"fileName\": \"${file.name}\", \"isFile\": ${file.isFile}, \"isDirectory\": ${file.isDirectory} }"
    }
    return "[$files]"
  }

  @JavascriptInterface
  fun createFileInTree(tree: String, fileName: String): String {
    val directory = findTreeFileFromUri(tree)
    return directory!!.createFile("*/*", fileName)!!.uri.toString()
  }

  @JavascriptInterface
  fun createDirectoryInTree(tree: String, fileName: String): String {
    val directory = findTreeFileFromUri(tree)
    return directory!!.createDirectory(fileName)!!.uri.toString()
  }

  @JavascriptInterface
  fun deleteFileInTree(fileUri: String): Boolean {
    val file = findTreeFileFromUri(fileUri)
    return file!!.delete()
  }

  /**
   * hides the splashscreen
   */
  @JavascriptInterface
  fun hideSplashScreen() {
    context.showSplashScreen = false
  }

  @JavascriptInterface
  fun restart() {
    context.finish()
    context.startActivity(Intent(Intent.ACTION_MAIN)
      .addCategory(Intent.CATEGORY_LAUNCHER)
      .setClass(context,  MainActivity::class.java))
  }

  @JavascriptInterface
  fun getSyncMessage(promise: String): String {
    val value = syncMessages[promise]
    syncMessages.remove(promise)
    return value!!
  }

  @JavascriptInterface
  fun enableKeepScreenOn() {
    if (!keepScreenOn) {
      keepScreenOn = true
      context.runOnUiThread {
        context.window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
      }
    }
  }

  @JavascriptInterface
  fun disableKeepScreenOn() {
    if (keepScreenOn) {
      keepScreenOn = false
      context.runOnUiThread {
        context.window.clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
      }
    }
  }
  private fun hexToColour(hex: String) : Int {
    return if (hex.length === 7) {
      Color.rgb(
        Integer.valueOf(hex.substring(1, 3), 16),
        Integer.valueOf(hex.substring(3, 5), 16),
        Integer.valueOf(hex.substring(5, 7), 16)
      )
    } else if (hex.length === 4) {
      val r = hex.substring(1, 2)
      val g = hex.substring(2, 3)
      val b = hex.substring(3, 4)
      Color.rgb(
        Integer.valueOf("$r$r", 16),
        Integer.valueOf("$g$g", 16),
        Integer.valueOf("$b$b", 16)
      )
    } else {
      Color.TRANSPARENT
    }
  }

  /**
   *
   */
  @JavascriptInterface
  fun themeSystemUi(navigationHex: String, statusHex: String, navigationDarkMode: Boolean  = true,  statusDarkMode: Boolean = true) {
    context.runOnUiThread {
      val windowInsetsController =
        WindowCompat.getInsetsController(context.window, context.window.decorView)
      windowInsetsController.isAppearanceLightNavigationBars = !navigationDarkMode
      windowInsetsController.isAppearanceLightStatusBars = !statusDarkMode
      context.window.navigationBarColor = hexToColour(navigationHex)
      context.window.statusBarColor = hexToColour(statusHex)
    }
  }

  @JavascriptInterface
  fun getSystemTheme(): String {
    if (context.darkMode) {
      return "dark"
    } else {
      return "light"
    }
  }

  @JavascriptInterface
  fun isAppPaused(): Boolean {
    return context.paused
  }

  @JavascriptInterface
  fun enterPromptMode() {
    context.webView.isVerticalScrollBarEnabled = false
    context.isInAPrompt = true
  }

  @JavascriptInterface
  fun exitPromptMode() {
    context.webView.isVerticalScrollBarEnabled = true
    context.isInAPrompt = false
  }

  @JavascriptInterface
  fun generatePOTokenFromVisitorData(visitorData: String): String {
    val promise = jsPromise()
    val bgWv = context.bgWebView
    val script = context.readTextAsset("botGuardScript.js")
    try {
      val functionName = script.split("export{")[1].split(" as default};")[0]
      val exportSection = "export{${functionName} as default};"
      context.bgJsInterface.onReturnToken {
        run {
          context.runOnUiThread {
            resolve(promise, it)
            bgWv.loadUrl("about:blank")
          }
        }
      }
      val bakedScript =
        script.replace(exportSection, "; ${functionName}(\"${visitorData}\").then((TOKEN_RESULT) => { console.log(`Your potoken is \${TOKEN_RESULT}`) ; Android.returnToken(TOKEN_RESULT) })")
      context.runOnUiThread {
        bgWv.loadDataWithBaseURL(
          "https://www.youtube.com",
          "<script>${bakedScript}</script>",
          "text/html",
          "utf-8",
          null
        )
      }
    } catch (exception: Exception) {
      reject(promise, exception.message!!)
    }
    return promise
  }

  @JavascriptInterface
  fun queueFetchBody(id: String, body: String) {
    if (body != "undefined") {
      context.pendingRequestBodies[id] = body
    }
  }

  private fun addNamedCallbackToPromise(promise: String, name: String) {
    context.runOnUiThread {
      context.webView.loadUrl("javascript: window['${promise}'].callbacks = window['${promise}'].callbacks || {};  window['${promise}'].callbacks.notify = (key, message) => window['${promise}'].callbacks[key].forEach(callback => callback(message)); window['${promise}'].callbacks['${name}'] = window['${promise}'].callbacks['${name}'] || []")
    }
  }

  private fun notifyNamedCallback(promise: String, name: String, message: String) {
    context.webView.loadUrl("javascript: window['${promise}'].callbacks.notify(${context.btoa(name)}, ${context.btoa(message)})")
  }

  /**
   * @return the id of a promise on the window
   */
  private fun jsPromise(): String {
    val id = "${randomUUID()}"
    context.webView.post {
      context.webView.loadUrl("javascript: window['${id}'] = {}; window['${id}'].promise = new Promise((resolve, reject) => { window['${id}'].resolve = resolve; window['${id}'].reject = reject })")
    }
    return id
  }

  /**
   * resolves a js promise given the id
   */
  private fun resolve(id: String, message: String) {
    context.webView.post {
      syncMessages[id] = message
      context.webView.loadUrl("javascript: window['${id}'].resolve()")
    }
  }

  /**
   * rejects a js promise given the id
   */
  private fun reject(id: String, message: String) {
    context.webView.post {
      syncMessages[id] = message
      context.webView.loadUrl("javascript: window['${id}'].reject(new Error())")
    }
  }
}

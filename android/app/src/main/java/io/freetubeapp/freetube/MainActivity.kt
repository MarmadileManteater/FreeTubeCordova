package io.freetubeapp.freetube

import android.annotation.SuppressLint
import android.content.Intent
import android.content.res.Configuration
import android.graphics.Color
import android.os.Build
import android.os.Bundle
import android.view.View
import android.view.ViewGroup
import android.view.ViewTreeObserver
import android.webkit.ConsoleMessage
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.FrameLayout
import androidx.activity.addCallback
import androidx.activity.result.ActivityResult
import androidx.activity.result.ActivityResultLauncher
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.ActivityCompat.OnRequestPermissionsResultCallback
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat
import io.freetubeapp.freetube.databinding.ActivityMainBinding
import org.json.JSONObject
import java.net.URLEncoder
import java.util.Base64
import java.util.UUID
import java.util.concurrent.BlockingQueue
import java.util.concurrent.LinkedBlockingQueue
import java.util.concurrent.ThreadPoolExecutor
import java.util.concurrent.TimeUnit


class MainActivity : AppCompatActivity(), OnRequestPermissionsResultCallback {

  private lateinit var binding: ActivityMainBinding
  private lateinit var permissionsListeners: MutableList<(Int, Array<String?>, IntArray) -> Unit>
  private lateinit var activityResultListeners: MutableList<(ActivityResult?) -> Unit>
  private lateinit var keepAliveService: KeepAliveService
  private lateinit var keepAliveIntent: Intent
  private var fullscreenView: View? = null
  lateinit var webView: BackgroundPlayWebView
  lateinit var jsInterface: FreeTubeJavaScriptInterface
  lateinit var activityResultLauncher: ActivityResultLauncher<Intent>
  lateinit var content: View
  var consoleMessages: MutableList<JSONObject> = mutableListOf()
  var showSplashScreen: Boolean = true
  var darkMode: Boolean = false
  var paused: Boolean = false
  var isInAPrompt: Boolean = false
  /*
   * Gets the number of available cores
   * (not always the same as the maximum number of cores)
   */
  private val NUMBER_OF_CORES = Runtime.getRuntime().availableProcessors()

  // Instantiates the queue of Runnables as a LinkedBlockingQueue
  private val workQueue: BlockingQueue<Runnable> = LinkedBlockingQueue()

  // Sets the amount of time an idle thread waits before terminating
  private val KEEP_ALIVE_TIME = 1

  // Sets the Time Unit to seconds
  private val KEEP_ALIVE_TIME_UNIT: TimeUnit = TimeUnit.SECONDS

  // Creates a thread pool manager
  var threadPoolExecutor = ThreadPoolExecutor(
    NUMBER_OF_CORES,  // Initial pool size
    NUMBER_OF_CORES,  // Max pool size
    KEEP_ALIVE_TIME.toLong(),
    KEEP_ALIVE_TIME_UNIT,
    workQueue
  )

  @Suppress("DEPRECATION")
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    when (resources.configuration.uiMode and Configuration.UI_MODE_NIGHT_MASK) {
      Configuration.UI_MODE_NIGHT_NO -> {
        darkMode = false
      }
      Configuration.UI_MODE_NIGHT_YES -> {
        darkMode = true
      }
    }

    content = findViewById(android.R.id.content)
    content.viewTreeObserver.addOnPreDrawListener(
      object : ViewTreeObserver.OnPreDrawListener {
        override fun onPreDraw(): Boolean {
          // Check whether the initial data is ready.
          return if (!showSplashScreen) {
            // The content is ready. Start drawing.
            content.viewTreeObserver.removeOnPreDrawListener(this)
            true
          } else {
            // The content isn't ready. Suspend.
            false
          }
        }
      }
    )

    activityResultListeners = mutableListOf()

    activityResultLauncher = registerForActivityResult(ActivityResultContracts.StartActivityForResult()) {
      for (listener in activityResultListeners) {
        listener(it)
      }
      // clear the listeners
      activityResultListeners = mutableListOf()
    }

    MediaControlsReceiver.notifyMediaSessionListeners = {
        action ->
      webView.loadUrl(String.format("javascript: window.notifyMediaSessionListeners('%s')", action))
    }

    // this keeps android from shutting off the app to conserve battery
    keepAliveService = KeepAliveService()
    keepAliveIntent = Intent(this, keepAliveService.javaClass)
    startService(keepAliveIntent)

    // this gets the controller for hiding and showing the system bars
    WindowCompat.setDecorFitsSystemWindows(window, false)
    val windowInsetsController =
      WindowCompat.getInsetsController(window, window.decorView)
    windowInsetsController.systemBarsBehavior =
      WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE

    // initialize the list of listeners for permissions handlers
    permissionsListeners = arrayOf<(Int, Array<String?>, IntArray) -> Unit>().toMutableList()

    binding = ActivityMainBinding.inflate(layoutInflater)
    setContentView(binding.root)
    webView = binding.webView
    webView.setBackgroundColor(Color.TRANSPARENT)

    // bind the back button to the web-view history
    onBackPressedDispatcher.addCallback {
      if (isInAPrompt) {
        webView.post {
          webView.loadUrl("javascript: window.dispatchEvent(new Event(\"exit-prompt\"))")
          jsInterface.exitPromptMode()
        }
      } else {
        if (webView.canGoBack()) {
          webView.goBack()
        } else {
          this@MainActivity.moveTaskToBack(true)
        }
      }
    }

    webView.settings.javaScriptEnabled = true

    // this is the 🥃 special sauce that makes local api streaming a possibility
    webView.settings.allowUniversalAccessFromFileURLs = true
    webView.settings.allowFileAccessFromFileURLs = true
    // allow playlist ▶auto-play in background
    webView.settings.mediaPlaybackRequiresUserGesture = false

    jsInterface = FreeTubeJavaScriptInterface(this)
    webView.addJavascriptInterface(jsInterface, "Android")
    webView.webChromeClient = object: WebChromeClient() {

      override fun onConsoleMessage(consoleMessage: ConsoleMessage): Boolean {
        val messageData = JSONObject()
        messageData.put("content", consoleMessage.message())
        messageData.put("level", consoleMessage.messageLevel())
        messageData.put("timestamp", System.currentTimeMillis())
        messageData.put("id", UUID.randomUUID())
        messageData.put("key", "${messageData["id"]}-${messageData["timestamp"]}")
        messageData.put("sourceId", consoleMessage.sourceId())
        messageData.put("lineNumber", consoleMessage.lineNumber())
        consoleMessages.add(messageData)
        webView.loadUrl("javascript: var event = new Event(\"console-message\"); event.data = JSON.parse(${btoa(messageData.toString())}); window.dispatchEvent(event)")
        return super.onConsoleMessage(consoleMessage);
      }

      override fun onShowCustomView(view: View?, callback: CustomViewCallback?) {
        windowInsetsController.hide(WindowInsetsCompat.Type.systemBars())
        fullscreenView = view!!
        view.layoutParams = FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT)
        this@MainActivity.binding.root.addView(view)
        webView.visibility = View.GONE
        this@MainActivity.binding.root.fitsSystemWindows = false

        webView.loadUrl("javascript: window.dispatchEvent(new Event(\"start-fullscreen\"))")
      }

      override fun onHideCustomView() {
        webView.visibility = View.VISIBLE
        this@MainActivity.binding.root.removeView(fullscreenView)
        fullscreenView = null
        windowInsetsController.show(WindowInsetsCompat.Type.systemBars())
        this@MainActivity.binding.root.fitsSystemWindows = true

        webView.loadUrl("javascript: window.dispatchEvent(new Event(\"end-fullscreen\"))")
      }
    }
    webView.webViewClient = object: WebViewClient() {
      override fun shouldOverrideUrlLoading(view: WebView?, request: WebResourceRequest?): Boolean {
        if (request!!.url!!.scheme == "file") {
          // don't send file url requests to a web browser (it will crash the app)
          return true
        }
        val regex = """^https?:\/\/((www\.)?youtube\.com(\/embed)?|youtu\.be)\/.*$"""

        if (Regex(regex).containsMatchIn(request!!.url!!.toString())) {
          webView.loadUrl("javascript: window.notifyYoutubeLinkHandlers(\"${request!!.url}\")")
          return true
        }
        // send all requests to a real web browser
        val intent = Intent(Intent.ACTION_VIEW, request!!.url)
        this@MainActivity.startActivity(intent)
        return true
      }
    }
    if (intent!!.data !== null) {
      val url = intent!!.data.toString()
      val host = intent!!.data!!.host.toString()
      val intentPath = if (host != "youtube.com" && host != "youtu.be" && host != "m.youtube.com" && host != "www.youtube.com") {
        url.replace("${intent!!.data!!.host}", "youtube.com")
      } else {
        url
      }
      val intentEncoded = URLEncoder.encode(intentPath)
      webView.loadUrl("file:///android_asset/index.html?intent=${intentEncoded}")
    } else {
      webView.loadUrl("file:///android_asset/index.html")
    }
  }

  fun listenForPermissionsCallbacks(listener: (Int, Array<String?>, IntArray) -> Unit) {
    permissionsListeners.add(listener)
  }
  fun listenForActivityResults(listener: (ActivityResult?) -> Unit) {
    activityResultListeners.add(listener)
  }

  fun consoleError(message: String) {
    consoleLog(message, "error")
  }

  fun consoleWarn(message: String) {
    consoleLog(message, "warn")
  }

  /**
   * @param message the message to log
   * @param level used in js as "console.$level" (ex: log, warn, error)
   */
  fun consoleLog(message: String, level: String = "log") {
    webView.post {
      webView.loadUrl("javascript: console.$level(${btoa(message)})")
    }
  }

  /**
   * encodes a string message for transport across the java bridge
   * @param message the message to be encoded
   */
  fun btoa(message: String): String {
    return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      val encoder = Base64.getEncoder()
      "atob(\"${encoder.encodeToString(message.encodeToByteArray())}\")"
    } else {
      "`${message}`"
    }
  }

  override fun onConfigurationChanged(newConfig: Configuration) {
    super.onConfigurationChanged(newConfig)
    when (newConfig.uiMode and Configuration.UI_MODE_NIGHT_MASK) {
      Configuration.UI_MODE_NIGHT_NO -> {
        darkMode = false
        webView.post {
          webView.loadUrl("javascript: window.dispatchEvent(new Event(\"enabled-light-mode\"))")
        }
      }
      Configuration.UI_MODE_NIGHT_YES -> {
        darkMode = true
        webView.post {
          webView.loadUrl("javascript: window.dispatchEvent(new Event(\"enabled-dark-mode\"))")
        }
      }
    }
  }

  override fun onRequestPermissionsResult(
    requestCode: Int, permissions: Array<String?>,
    grantResults: IntArray
  ) {
    super.onRequestPermissionsResult(requestCode, permissions, grantResults)
    permissionsListeners.forEach {
      it(requestCode, permissions, grantResults)
    }
    permissionsListeners.clear()
  }

  /**
   * handles new intents which involve deep links (aka supported links)
   */
  @SuppressLint("MissingSuperCall")
  override fun onNewIntent(intent: Intent?) {
    if (intent!!.data !== null) {
      val uri = intent!!.data
      val isYT =
        uri!!.host!! == "www.youtube.com" || uri!!.host!! == "youtube.com" || uri!!.host!! == "m.youtube.com" || uri!!.host!! == "youtu.be"
      val url = if (!isYT) {
        uri.toString().replace(uri.host.toString(), "www.youtube.com")
      } else {
        uri
      }
      webView.loadUrl("javascript: window.notifyYoutubeLinkHandlers(\"${url}\")")
    }
  }

  override fun onPause() {
    super.onPause()
    paused = true
    webView.loadUrl("javascript: window.dispatchEvent(new Event(\"app-pause\"))")
  }

  override fun onResume() {
    super.onResume()
    paused = false
    webView.loadUrl("javascript: window.dispatchEvent(new Event(\"app-resume\"))")
  }

  override fun onDestroy() {
    // stop the keep alive service
    stopService(keepAliveIntent)
    // cancel media notification (if there is one)
    jsInterface.cancelMediaNotification()
    // clean up the web view
    webView.destroy()
    // call `super`
    super.onDestroy()
  }
}

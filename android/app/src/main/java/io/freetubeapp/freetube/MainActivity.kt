package io.freetubeapp.freetube

import android.content.Intent
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.view.View
import android.view.ViewGroup
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.FrameLayout
import androidx.activity.addCallback
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.ActivityCompat.OnRequestPermissionsResultCallback
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat
import io.freetubeapp.freetube.databinding.ActivityMainBinding


class MainActivity : AppCompatActivity(), OnRequestPermissionsResultCallback {

  private lateinit var binding: ActivityMainBinding
  private lateinit var permissionsListeners: MutableList<(Int, Array<String?>, IntArray) -> Unit>
  private lateinit var keepAliveService: KeepAliveService
  private lateinit var keepAliveIntent: Intent
  private var fullscreenView: View? = null
  lateinit var webView: BackgroundPlayWebView

  @Suppress("DEPRECATION")
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)

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

    // bind the back button to the web-view history
    onBackPressedDispatcher.addCallback {
      if (webView.canGoBack()) {
        webView.loadUrl("javascript: window.history.goBack()")
      } else {
        this@MainActivity.moveTaskToBack(true)
      }
    }

    webView.settings.javaScriptEnabled = true
    webView.settings.cacheMode = WebSettings.LOAD_NO_CACHE

    // this is the 🥃 special sauce that makes local api streaming a possibility
    // webView.settings.allowUniversalAccessFromFileURLs = true
    // webView.settings.allowFileAccessFromFileURLs = true

    val jsInterface = FreeTubeJavaScriptInterface(this)
    webView.addJavascriptInterface(jsInterface, "Android")
    webView.webChromeClient = object: WebChromeClient() {

      override fun onShowCustomView(view: View?, callback: CustomViewCallback?) {
        windowInsetsController.hide(WindowInsetsCompat.Type.systemBars())
        fullscreenView = view!!
        view.layoutParams = FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT)
        this@MainActivity.binding.root.addView(view)
        webView.visibility = View.GONE
        this@MainActivity.binding.root.fitsSystemWindows = false
      }

      override fun onHideCustomView() {
        webView.visibility = View.VISIBLE
        this@MainActivity.binding.root.removeView(fullscreenView)
        fullscreenView = null
        windowInsetsController.show(WindowInsetsCompat.Type.systemBars())
        this@MainActivity.binding.root.fitsSystemWindows = true
      }
    }
    // webView.loadUrl("file:///android_asset/index.html")
    val htmlFile = assets.open("index.html").bufferedReader().use { it.readText() }
    webView.webViewClient = object: WebViewClient() {
      override fun shouldInterceptRequest(
        view: WebView?,
        request: WebResourceRequest?
      ): WebResourceResponse? {
        // we are pretending to be youtube.com, so we need to intercept requests for our local resources
        if (request!!.url.toString().startsWith("https://www.youtube.com/")) {
          try {
            val mimeType = if (request!!.url.toString().endsWith(".css")) {
              "text/css"
            } else if (request!!.url.toString().endsWith(".js")) {
              "application/javascript"
            } else {
              "text/plain"
            }
            val asset = assets.open(request!!.url.path!!.substring(1))
            return WebResourceResponse(
              mimeType,
              "utf-8",
              asset
            )
          } catch (e: Exception) {
            println(e.message)
          }
        }
        return super.shouldInterceptRequest(view, request)
      }
    }

    webView.loadDataWithBaseURL("https://www.youtube.com/", htmlFile, "text/html", "utf-8", "file://android_asset/index.html")
    Handler(Looper.getMainLooper()).postDelayed({
      webView.loadUrl(
        "javascript: window.mediaSessionListeners = {};" +
          "window.addMediaSessionEventListener = function (eventName, listener) {" +
          "  if (!(eventName in window.mediaSessionListeners)) {" +
          "    window.mediaSessionListeners[eventName] = [];" +
          "  }" +
          "  window.mediaSessionListeners[eventName].push(listener);" +
          "};" +
          "window.notifyMediaSessionListeners = function (eventName, ...message) {" +
          "if ((eventName in window.mediaSessionListeners)) {" +
          "    window.mediaSessionListeners[eventName].forEach(listener => listener(...message));" +
          "  }" +
          "};" +
          "window.clearAllMediaSessionEventListeners = function () {" +
          "    window.mediaSessionListeners = {}" +
          "};"
      )
    }, 100)

  }

  fun listenForPermissionsCallbacks(listener: (Int, Array<String?>, IntArray) -> Unit) {
    permissionsListeners.add(listener)
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

  override fun onNewIntent(intent: Intent?) {
    super.onNewIntent(intent)
  }
}

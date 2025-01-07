package io.freetubeapp.freetube.webviews

import android.content.Context
import android.util.AttributeSet

class BotGuardWebView @JvmOverloads constructor(
  context: Context, attrs: AttributeSet? = null

) :
// no need to communicate window visibility to botguard
  BackgroundPlayWebView(context, attrs) {
}

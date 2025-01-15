package io.freetubeapp.freetube

import android.content.ContentResolver
import android.net.Uri
import io.freetubeapp.freetube.helpers.Promise
import io.freetubeapp.freetube.helpers.toJSON
import io.freetubeapp.freetube.javascript.consoleError
import java.io.File
import java.io.FileInputStream

fun ContentResolver.readFile(contentTreeUri: Uri): Promise<ByteArray> {
  return Promise {
     resolve,
     reject ->
     try {
       val stream = openInputStream(contentTreeUri)
       val content = stream!!.readBytes()
       stream.close()
       resolve(content)
     } catch (ex: Exception) {
       reject(ex.toJSON())
     }
  }
}

fun ContentResolver.writeFile(contentTreeUri: Uri, content: ByteArray, mode: String): Promise<Unit?> {
  return Promise {
    resolve,
    reject ->
    try {
      val stream = openOutputStream(contentTreeUri, mode)
      stream!!.write(content)
      stream.flush()
      stream.close()
      resolve(null)
    } catch (ex: Exception) {
      reject(ex.toJSON())
    }
  }
}

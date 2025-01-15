package io.freetubeapp.freetube.helpers

import android.content.ContentResolver
import android.net.Uri

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

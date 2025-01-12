package io.freetubeapp.freetube

import android.content.ContentResolver
import android.net.Uri
import io.freetubeapp.freetube.helpers.Promise
import io.freetubeapp.freetube.helpers.toJSON
import io.freetubeapp.freetube.javascript.consoleError
import java.io.File
import java.io.FileInputStream


fun ContentResolver.readFile(directoryName: String, fileName: String) : Promise<String> {
  return Promise {
    resolve,
    reject ->
    try {
      if (directoryName.startsWith("content://")) {
        val stream = openInputStream(Uri.parse(directoryName))
        val content = String(stream!!.readBytes())
        stream.close()
        resolve(content)
      } else {
        val file = File(directoryName, fileName)
        resolve(FileInputStream(file).bufferedReader().use { it.readText() })
      }
    } catch (ex: Exception) {
      reject(ex.toJSON())
    }
  }
}

fun ContentResolver.writeFile(directoryName: String, fileName: String, content: String, mode: String = "wt") : Promise<Unit?> {
  return Promise {
    resolve,
    reject ->
    try {
      if (directoryName.startsWith("content://")) {
        // urls created by save dialog
        val stream = openOutputStream(Uri.parse(directoryName), mode)
        stream!!.write(content.toByteArray())
        stream.flush()
        stream.close()
        resolve(null)
      } else {
        val file = File(directoryName, fileName)
        if (!file.exists()) {
          file.createNewFile()
        }
        file.writeText(content)
        resolve(null)
      }
    } catch (ex: Exception) {
      reject(ex.toJSON())
    }
  }
}

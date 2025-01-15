package io.freetubeapp.freetube

import android.content.ContentResolver
import android.net.Uri
import io.freetubeapp.freetube.helpers.Promise
import io.freetubeapp.freetube.helpers.toJSON
import io.freetubeapp.freetube.javascript.consoleError
import java.io.File
import java.io.FileInputStream

fun ContentResolver.readFileFromContentTree(contentTreeUri: Uri): Promise<String> {
  return Promise {
     resolve,
     reject ->
     try {
       val stream = openInputStream(contentTreeUri)
       val content = String(stream!!.readBytes())
       stream.close()
       resolve(content)
     } catch (ex: Exception) {
       reject(ex.toJSON())
     }
  }
}

// todo put this somewhere else
fun readFileFromAbsolutePath(directory: String, fileName: String) : Promise<String> {
  return Promise {
    resolve,
    reject ->
    try {
      val file = File(directory, fileName)
      resolve(FileInputStream(file).bufferedReader().use { it.readText() })
    } catch (ex: Exception) {
      reject(ex.toJSON())
    }
  }
}

fun ContentResolver.readFile(directoryName: String, fileName: String) : Promise<String> {
  return Promise {
    resolve,
    reject ->
    if (directoryName.startsWith("content://")) {
      readFileFromContentTree(Uri.parse(directoryName)).then {
        resolve(it)
      }.catch {
        reject(it)
      }
    } else {
      // TODO this shouldn't be called here, it should be called in the js interface
      readFileFromAbsolutePath(directoryName, fileName).then {
        resolve(it)
      }.catch {
        reject(it)
      }
    }
  }
}

fun ContentResolver.writeFileFromContentTree(contentTreeUri: Uri, content: String, mode: String): Promise<Unit?> {
  return Promise {
    resolve,
    reject ->
    try {
      val stream = openOutputStream(contentTreeUri, mode)
      stream!!.write(content.toByteArray())
      stream.flush()
      stream.close()
      resolve(null)
    } catch (ex: Exception) {
      reject(ex.toJSON())
    }
  }
}

// todo put this somewhere else
fun writeFileFromAbsolutePath(directory: String, fileName: String, content: String, mode: String = "wt") : Promise<Unit?> {
  return Promise {
    resolve,
    reject ->
    try {
      val file = File(directory, fileName)
      if (!file.exists()) {
        file.createNewFile()
      }
      if (mode == "wt") {
        file.writeText(content)
      }
      if (mode == "wa") {
        file.appendText(content)
      }
      resolve(null)
    } catch (ex: Exception) {
      reject(ex.toJSON())
    }
  }
}

fun ContentResolver.writeFile(directoryName: String, fileName: String, content: String, mode: String = "wt") : Promise<Unit?> {
  return Promise {
    resolve,
    reject ->
    if (directoryName.startsWith("content://")) {
      // urls created by save dialog
      writeFileFromContentTree(Uri.parse(directoryName), content, mode).then {
        resolve(it)
      }.catch {
        reject(it)
      }
    } else {
      // TODO this shouldn't be called here, it should be called in the js interface
      writeFileFromAbsolutePath(directoryName, fileName, content, mode).then {
        resolve(it)
      }.catch {
        reject(it)
      }
    }
  }
}

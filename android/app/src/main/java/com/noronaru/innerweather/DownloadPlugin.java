package com.noronaru.innerweather;

import android.content.ContentResolver;
import android.content.ContentValues;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.provider.MediaStore;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.File;
import java.io.FileWriter;
import java.io.OutputStream;

@CapacitorPlugin(name = "DownloadHelper")
public class DownloadPlugin extends Plugin {

    @PluginMethod
    public void saveToDownloads(PluginCall call) {
        String fileName = call.getString("fileName");
        String content  = call.getString("content");
        if (fileName == null || content == null) { call.reject("Missing fileName or content"); return; }

        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                // Android 10+ — use MediaStore.Downloads (no permission needed)
                ContentValues values = new ContentValues();
                values.put(MediaStore.Downloads.DISPLAY_NAME, fileName);
                values.put(MediaStore.Downloads.MIME_TYPE, "application/json");
                values.put(MediaStore.Downloads.IS_PENDING, 1);
                ContentResolver resolver = getContext().getContentResolver();
                Uri uri = resolver.insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, values);
                try (OutputStream os = resolver.openOutputStream(uri)) {
                    os.write(content.getBytes("UTF-8"));
                }
                values.clear();
                values.put(MediaStore.Downloads.IS_PENDING, 0);
                resolver.update(uri, values, null, null);
            } else {
                // Android 9 and below — direct file write to public Downloads
                File dir  = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS);
                File file = new File(dir, fileName);
                try (FileWriter fw = new FileWriter(file)) { fw.write(content); }
            }
            call.resolve();
        } catch (Exception e) {
            call.reject("Download failed: " + e.getMessage());
        }
    }
}

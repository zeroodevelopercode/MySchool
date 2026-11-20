package com.zeroodev.sekolahku;

import android.app.DownloadManager;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.os.Handler;
import android.os.Looper;
import android.provider.Settings;
import android.database.Cursor;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "ApkUpdate")
public class ApkUpdatePlugin extends Plugin {
    private final Handler handler = new Handler(Looper.getMainLooper());
    private DownloadManager manager;

    @PluginMethod
    public void downloadAndInstall(PluginCall call) {
        manager = (DownloadManager) getContext().getSystemService(Context.DOWNLOAD_SERVICE);
        // Always fetch the exact APK URL supplied by the current update check.
        // Reusing a previous successful DownloadManager ID can reinstall a stale APK.
        String url = call.getString("url");
        if (url == null || !url.startsWith("https://")) {
            call.reject("URL APK tidak valid.");
            return;
        }

        DownloadManager.Request request = new DownloadManager.Request(Uri.parse(url));
        request.setTitle("Pembaruan SekolahKu");
        request.setDescription("Mengunduh APK versi terbaru...");
        request.setMimeType("application/vnd.android.package-archive");
        request.setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE);
        request.setAllowedOverMetered(true);
        request.setAllowedOverRoaming(false);
        String fileName = "SekolahKu-update-" + System.currentTimeMillis() + ".apk";
        request.setDestinationInExternalFilesDir(getContext(), Environment.DIRECTORY_DOWNLOADS, fileName);
        long id = manager.enqueue(request);
        call.resolve();
        pollDownload(id);
    }

    private boolean isDownloadSuccessful(long id) {
        DownloadManager.Query query = new DownloadManager.Query().setFilterById(id);
        try (Cursor cursor = manager.query(query)) {
            return cursor != null && cursor.moveToFirst()
                && cursor.getInt(cursor.getColumnIndexOrThrow(DownloadManager.COLUMN_STATUS)) == DownloadManager.STATUS_SUCCESSFUL;
        } catch (Exception ignored) {
            return false;
        }
    }

    private void pollDownload(long id) {
        Runnable poller = new Runnable() {
            @Override public void run() {
                DownloadManager.Query query = new DownloadManager.Query().setFilterById(id);
                try (Cursor cursor = manager.query(query)) {
                    if (cursor == null || !cursor.moveToFirst()) {
                        notifyUpdateError("Unduhan pembaruan tidak ditemukan.");
                        return;
                    }
                    int status = cursor.getInt(cursor.getColumnIndexOrThrow(DownloadManager.COLUMN_STATUS));
                    long total = cursor.getLong(cursor.getColumnIndexOrThrow(DownloadManager.COLUMN_TOTAL_SIZE_BYTES));
                    long downloaded = cursor.getLong(cursor.getColumnIndexOrThrow(DownloadManager.COLUMN_BYTES_DOWNLOADED_SO_FAR));
                    JSObject progress = new JSObject();
                    progress.put("downloaded", downloaded);
                    progress.put("total", total);
                    progress.put("percent", total > 0 ? Math.min(100, (int) (downloaded * 100 / total)) : 0);
                    notifyListeners("downloadProgress", progress);

                    if (status == DownloadManager.STATUS_SUCCESSFUL) {
                        installOrRequestPermission(id);
                    } else if (status == DownloadManager.STATUS_FAILED) {
                        int reason = cursor.getInt(cursor.getColumnIndexOrThrow(DownloadManager.COLUMN_REASON));
                        notifyUpdateError("Unduhan APK gagal. Kode: " + reason);
                    } else {
                        handler.postDelayed(this, 450);
                    }
                } catch (Exception error) {
                    notifyUpdateError("Gagal memeriksa unduhan: " + error.getMessage());
                }
            }
        };
        handler.post(poller);
    }

    private void installOrRequestPermission(long id) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && !getContext().getPackageManager().canRequestPackageInstalls()) {
            Intent settings = new Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES,
                Uri.parse("package:" + getContext().getPackageName()));
            settings.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(settings);
            JSObject result = new JSObject();
            result.put("permissionRequired", true);
            notifyListeners("installPermissionRequired", result);
            return;
        }

        Uri apkUri = manager.getUriForDownloadedFile(id);
        if (apkUri == null) {
            notifyUpdateError("File APK hasil unduhan tidak tersedia.");
            return;
        }
        Intent install = new Intent(Intent.ACTION_VIEW);
        install.setDataAndType(apkUri, "application/vnd.android.package-archive");
        install.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_GRANT_READ_URI_PERMISSION);
        try {
            getContext().startActivity(install);
        } catch (Exception error) {
            notifyUpdateError("Android tidak dapat membuka Package Installer: " + error.getMessage());
        }
    }

    private void notifyUpdateError(String message) {
        JSObject result = new JSObject();
        result.put("message", message);
        notifyListeners("updateError", result);
    }
}

package com.newszxcn.newmail;

import android.webkit.CookieManager;
import android.webkit.URLUtil;
import android.widget.Toast;
import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

final class AttachmentDownloads {
    private static final long MAX_BYTES = 100L * 1024 * 1024;
    private final MainActivity activity;
    private final ExecutorService executor = Executors.newSingleThreadExecutor();
    private final ActivityResultLauncher<String> saveFile;
    private File pending;
    private boolean busy;

    AttachmentDownloads(MainActivity activity) {
        this.activity = activity;
        saveFile = activity.registerForActivityResult(new ActivityResultContracts.CreateDocument("application/octet-stream"), uri -> {
            File file = pending;
            pending = null;
            if (file == null) { busy = false; return; }
            executor.execute(() -> {
                boolean saved = false;
                try {
                    if (uri != null) {
                        try (InputStream in = new FileInputStream(file);
                             OutputStream out = activity.getContentResolver().openOutputStream(uri, "w")) {
                            if (out == null) throw new IOException("No output stream");
                            copy(in, out);
                        }
                        saved = true;
                    }
                } catch (IOException ignored) {
                    show("保存附件失败，请重试。");
                } finally {
                    file.delete();
                    boolean success = saved;
                    activity.runOnUiThread(() -> { busy = false; if (success) show("附件已保存"); });
                }
            });
        });
    }

    void download(String url) {
        if (!LiveMailRouting.isDownload(url)) return;
        if (busy) { show("正在处理附件，请稍候。"); return; }
        busy = true;
        show("正在下载附件…");
        String cookie = CookieManager.getInstance().getCookie("https://" + LiveMailRouting.HOST);
        executor.execute(() -> {
            HttpURLConnection connection = null;
            File temp = null;
            try {
                connection = (HttpURLConnection) new URL(url).openConnection();
                connection.setInstanceFollowRedirects(false);
                connection.setConnectTimeout(15000);
                connection.setReadTimeout(60000);
                if (cookie != null) connection.setRequestProperty("Cookie", cookie);
                if (connection.getResponseCode() != 200 || connection.getContentLengthLong() > MAX_BYTES) throw new IOException("Download rejected");
                File dir = new File(activity.getCacheDir(), "mail-downloads");
                if (!dir.exists() && !dir.mkdirs()) throw new IOException("No cache directory");
                temp = File.createTempFile("attachment-", ".tmp", dir);
                try (InputStream in = connection.getInputStream(); OutputStream out = new FileOutputStream(temp)) {
                    copy(in, out);
                }
                String guessed = URLUtil.guessFileName(url, connection.getHeaderField("Content-Disposition"), connection.getContentType());
                String name = guessed.replaceAll("[\\\\/\\p{Cntrl}]", "_");
                if (name.length() > 180) name = name.substring(name.length() - 180);
                File ready = temp;
                String filename = name;
                activity.runOnUiThread(() -> {
                    if (activity.isFinishing() || activity.isDestroyed()) { ready.delete(); busy = false; return; }
                    pending = ready;
                    try { saveFile.launch(filename); }
                    catch (RuntimeException ignored) { ready.delete(); pending = null; busy = false; show("无法打开文件保存器。"); }
                });
            } catch (IOException ignored) {
                if (temp != null) temp.delete();
                activity.runOnUiThread(() -> { busy = false; show("附件下载失败，请检查登录、网络和附件大小（上限 100 MB）。"); });
            } finally {
                if (connection != null) connection.disconnect();
            }
        });
    }

    private static void copy(InputStream in, OutputStream out) throws IOException {
        byte[] buffer = new byte[16384];
        long count = 0;
        int read;
        while ((read = in.read(buffer)) != -1) {
            count += read;
            if (count > MAX_BYTES) throw new IOException("Attachment too large");
            out.write(buffer, 0, read);
        }
    }

    private void show(String message) {
        activity.runOnUiThread(() -> Toast.makeText(activity, message, Toast.LENGTH_SHORT).show());
    }
}

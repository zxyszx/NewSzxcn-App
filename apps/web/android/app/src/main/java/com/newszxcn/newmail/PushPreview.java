package com.newszxcn.newmail;

import android.content.Context;
import android.webkit.CookieManager;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.Objects;
import org.json.JSONObject;

final class PushPreview {
    static String subject(Context context, String eventID) {
        String origin = "https://" + LiveMailRouting.HOST;
        String cookie = CookieManager.getInstance().getCookie(origin);
        if (cookie == null || cookie.isEmpty() || !eventID.matches("[a-f0-9]{32}")) return "";
        HttpURLConnection connection = null;
        try {
            connection = (HttpURLConnection) new URL(origin + "/api/me/push-events/" + eventID).openConnection();
            connection.setInstanceFollowRedirects(false);
            connection.setConnectTimeout(3000);
            connection.setReadTimeout(3000);
            connection.setRequestProperty("Cookie", cookie);
            if (connection.getResponseCode() != 200) return "";
            try (java.io.InputStream input = connection.getInputStream()) {
                byte[] buffer = new byte[2049];
                int total = 0, read;
                while (total < buffer.length && (read = input.read(buffer, total, buffer.length - total)) != -1) total += read;
                if (total > 2048 || !Objects.equals(cookie, CookieManager.getInstance().getCookie(origin)) || !NativeMailNotifications.active(context)) return "";
                return new JSONObject(new String(buffer, 0, total, StandardCharsets.UTF_8)).optString("subject", "");
            }
        } catch (Exception ignored) {
            return "";
        } finally {
            if (connection != null) connection.disconnect();
        }
    }
}

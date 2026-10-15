package com.newszxcn.newmail;

import android.content.Context;
import android.webkit.CookieManager;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.Objects;
import org.json.JSONObject;

final class PushPreview {
    final String subject;
    final String mailboxAddress;

    PushPreview(String subject, String mailboxAddress) {
        this.subject = subject;
        this.mailboxAddress = mailboxAddress;
    }

    private static PushPreview empty() { return new PushPreview("", ""); }

    static PushPreview fetch(Context context, String eventID) {
        String origin = "https://" + LiveMailRouting.HOST;
        String cookie = CookieManager.getInstance().getCookie(origin);
        if (cookie == null || cookie.isEmpty() || eventID == null || !eventID.matches("[a-f0-9]{32}")) return empty();
        HttpURLConnection connection = null;
        try {
            connection = (HttpURLConnection) new URL(origin + "/api/me/push-events/" + eventID).openConnection();
            connection.setInstanceFollowRedirects(false);
            connection.setConnectTimeout(3000);
            connection.setReadTimeout(3000);
            connection.setRequestProperty("Cookie", cookie);
            if (connection.getResponseCode() != 200) return empty();
            try (java.io.InputStream input = connection.getInputStream()) {
                byte[] buffer = new byte[4097];
                int total = 0, read;
                while (total < buffer.length && (read = input.read(buffer, total, buffer.length - total)) != -1) total += read;
                if (total > 4096 || !Objects.equals(cookie, CookieManager.getInstance().getCookie(origin)) || !NativeMailNotifications.active(context)) return empty();
                JSONObject preview = new JSONObject(new String(buffer, 0, total, StandardCharsets.UTF_8));
                return new PushPreview(preview.optString("subject", ""), preview.optString("mailboxAddress", ""));
            }
        } catch (Exception ignored) {
            return empty();
        } finally {
            if (connection != null) connection.disconnect();
        }
    }
}

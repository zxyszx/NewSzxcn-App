package com.newszxcn.newmail;

import android.content.Context;
import android.content.SharedPreferences;
import android.webkit.CookieManager;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.util.Objects;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import org.json.JSONObject;

final class NativePushRegistration {
    private static final ExecutorService EXECUTOR = Executors.newSingleThreadExecutor();
    private static final String ORIGIN = "https://" + LiveMailRouting.HOST;

    static void sync(Context context) {
        if (!BuildConfig.PUSH_CONFIGURED || !NativeMailNotifications.active(context) || !NativeMailNotifications.allowed(context)) return;
        Context app = context.getApplicationContext();
        String cookie = CookieManager.getInstance().getCookie(ORIGIN);
        if (cookie == null || cookie.isEmpty()) return;
        EXECUTOR.execute(() -> register(app, cookie));
    }

    private static String randomID() {
        byte[] bytes = new byte[32];
        new SecureRandom().nextBytes(bytes);
        return android.util.Base64.encodeToString(bytes, android.util.Base64.URL_SAFE | android.util.Base64.NO_WRAP | android.util.Base64.NO_PADDING);
    }

    private static void register(Context context, String cookie) {
        SharedPreferences state = context.getSharedPreferences("mail-push", Context.MODE_PRIVATE);
        String token = state.getString("token", "");
        if (!NativeMailNotifications.active(context) || token.isEmpty() || !Objects.equals(cookie, CookieManager.getInstance().getCookie(ORIGIN))) return;
        // Installation proof is native-only and survives account changes, not uninstall.
        SharedPreferences identity = context.getSharedPreferences("mail-push-identity", Context.MODE_PRIVATE);
        String id = identity.getString("id", "");
        String secret = identity.getString("secret", "");
        if (id.isEmpty() || secret.isEmpty()) {
            id = randomID(); secret = randomID();
            if (!identity.edit().putString("id", id).putString("secret", secret).commit()) return;
        }
        HttpURLConnection connection = null;
        try {
            byte[] body = new JSONObject().put("id", id).put("secret", secret).put("token", token).toString().getBytes(StandardCharsets.UTF_8);
            connection = (HttpURLConnection) new URL(ORIGIN + "/api/me/push-devices").openConnection();
            connection.setInstanceFollowRedirects(false);
            connection.setConnectTimeout(10000);
            connection.setReadTimeout(10000);
            connection.setRequestMethod("POST");
            connection.setRequestProperty("Content-Type", "application/json");
            connection.setRequestProperty("Cookie", cookie);
            connection.setDoOutput(true);
            connection.setFixedLengthStreamingMode(body.length);
            try (java.io.OutputStream out = connection.getOutputStream()) { out.write(body); }
            boolean registered = false;
            String binding = "";
            if (connection.getResponseCode() == 200) {
                try (java.io.InputStream input = connection.getInputStream()) {
                    byte[] response = new byte[2049];
                    int total = 0, read;
                    while (total < response.length && (read = input.read(response, total, response.length - total)) != -1) total += read;
                    if (total <= 2048) {
                        binding = new JSONObject(new String(response, 0, total, StandardCharsets.UTF_8)).optString("bindingId", "");
                        registered = binding.matches("[a-f0-9]{64}");
                    }
                }
            }
            if (NativeMailNotifications.active(context) && Objects.equals(cookie, CookieManager.getInstance().getCookie(ORIGIN)) && token.equals(state.getString("token", ""))) {
                state.edit().putBoolean("registered", registered).putString("binding", registered ? binding : "").apply();
            }
        } catch (Exception ignored) {
            // Retry on resume or the next authenticated periodic refresh; never log credentials.
        } finally {
            if (connection != null) connection.disconnect();
        }
    }
}

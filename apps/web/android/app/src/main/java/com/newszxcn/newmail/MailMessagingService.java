package com.newszxcn.newmail;

import com.google.firebase.messaging.FirebaseMessagingService;
import com.google.firebase.messaging.RemoteMessage;

public class MailMessagingService extends FirebaseMessagingService {
    @Override public void onNewToken(String token) {
        if (BuildConfig.PUSH_CONFIGURED && NativeMailNotifications.active(this)) {
            getSharedPreferences("mail-push", MODE_PRIVATE).edit().putString("token", token).apply();
            NativePushRegistration.sync(this);
        }
    }

    @Override public void onMessageReceived(RemoteMessage message) {
        // The server must use data-only, privacy-preserving messages, never remote URLs or content.
        if (!BuildConfig.PUSH_CONFIGURED || !NativeMailNotifications.active(this) || NativeMailNotifications.foreground) return;
        String eventID = message.getData().get("event_id");
        if (!PushMessagePolicy.accepts(message.getData().get("type"), eventID, message.getData().get("binding_id"),
            getSharedPreferences("mail-push", MODE_PRIVATE).getString("binding", ""))) return;
        PushPreview preview = PushPreview.fetch(this, eventID);
        if (!NativeMailNotifications.active(this) || NativeMailNotifications.foreground || !PushMessagePolicy.accepts(message.getData().get("type"), eventID, message.getData().get("binding_id"),
            getSharedPreferences("mail-push", MODE_PRIVATE).getString("binding", ""))) return;
        NativeMailNotifications.showEvent(this, eventID, preview.subject, preview.mailboxAddress);
    }
}

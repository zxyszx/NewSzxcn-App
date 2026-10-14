package com.newszxcn.newmail;

import android.Manifest;
import android.app.NotificationManager;
import android.os.Build;
import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;
import com.google.firebase.messaging.FirebaseMessaging;

@CapacitorPlugin(name = "MailNotifications", permissions = {
    @Permission(alias = "notifications", strings = { Manifest.permission.POST_NOTIFICATIONS })
})
public class MailNotificationsPlugin extends Plugin {
    private NotificationManager manager() {
        return getContext().getSystemService(NotificationManager.class);
    }

    private boolean allowed() {
        return NativeMailNotifications.allowed(getContext());
    }

    @PluginMethod public void enable(PluginCall call) {
        NativeMailNotifications.channel(getContext());
        if (Build.VERSION.SDK_INT >= 33 && getPermissionState("notifications") != PermissionState.GRANTED) {
            requestPermissionForAlias("notifications", call, "permissionResult");
        } else permissionResult(call);
    }

    @PermissionCallback private void permissionResult(PluginCall call) {
        if (allowed() && BuildConfig.PUSH_CONFIGURED) {
            getContext().getSharedPreferences("mail-push", android.content.Context.MODE_PRIVATE).edit().putBoolean("active", true).apply();
            FirebaseMessaging messaging = FirebaseMessaging.getInstance();
            messaging.setAutoInitEnabled(true);
            messaging.getToken().addOnSuccessListener(token -> {
                if (NativeMailNotifications.active(getContext())) {
                    getContext().getSharedPreferences("mail-push", android.content.Context.MODE_PRIVATE).edit().putString("token", token).apply();
                    NativePushRegistration.sync(getContext());
                }
            });
        }
        JSObject result = new JSObject();
        result.put("enabled", allowed());
        call.resolve(result);
    }

    @PluginMethod public void showIncoming(PluginCall call) {
        if (!allowed()) { permissionResult(call); return; }
        NativeMailNotifications.show(getContext());
        call.resolve();
    }

    @PluginMethod public void clear(PluginCall call) {
        manager().cancel(1001);
        getContext().getSharedPreferences("mail-push", android.content.Context.MODE_PRIVATE).edit().clear().apply();
        if (BuildConfig.PUSH_CONFIGURED) {
            FirebaseMessaging.getInstance().setAutoInitEnabled(false);
            FirebaseMessaging.getInstance().deleteToken();
        }
        call.resolve();
    }

    @PluginMethod public void refreshRegistration(PluginCall call) {
        NativePushRegistration.sync(getContext());
        call.resolve();
    }

    @PluginMethod public void status(PluginCall call) {
        JSObject result = new JSObject();
        result.put("configured", BuildConfig.PUSH_CONFIGURED);
        result.put("enabled", allowed());
        result.put("tokenReady", getContext().getSharedPreferences("mail-push", android.content.Context.MODE_PRIVATE).contains("token"));
        result.put("registered", getContext().getSharedPreferences("mail-push", android.content.Context.MODE_PRIVATE).getBoolean("registered", false));
        call.resolve(result);
    }
}

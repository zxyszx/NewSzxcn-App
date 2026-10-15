package com.newszxcn.newmail;

import android.Manifest;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.os.Build;

final class NativeMailNotifications {
    static volatile boolean foreground;
    static final String CHANNEL = "incoming-mail";

    static synchronized void showEvent(Context context, String eventID, String subject) {
        if (!allowed(context)) return;
        android.content.SharedPreferences state = context.getSharedPreferences("mail-push", Context.MODE_PRIVATE);
        java.util.Set<String> seen = new java.util.HashSet<>(state.getStringSet("seen-events", java.util.Collections.emptySet()));
        if (seen.contains(eventID)) return;
        show(context, subject);
        if (seen.size() >= 256) seen.clear();
        seen.add(eventID);
        state.edit().putStringSet("seen-events", seen).apply();
    }

    static boolean active(Context context) {
        return context.getSharedPreferences("mail-push", Context.MODE_PRIVATE).getBoolean("active", false);
    }

    static void channel(Context context) {
        if (Build.VERSION.SDK_INT >= 26) {
            NotificationChannel channel = new NotificationChannel(CHANNEL, "新邮件", NotificationManager.IMPORTANCE_DEFAULT);
            channel.setLockscreenVisibility(Notification.VISIBILITY_PRIVATE);
            context.getSystemService(NotificationManager.class).createNotificationChannel(channel);
        }
    }

    static boolean allowed(Context context) {
        NotificationManager manager = context.getSystemService(NotificationManager.class);
        if (Build.VERSION.SDK_INT >= 33 && context.checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) return false;
        if (!manager.areNotificationsEnabled()) return false;
        if (Build.VERSION.SDK_INT >= 26) {
            NotificationChannel channel = manager.getNotificationChannel(CHANNEL);
            if (channel != null && channel.getImportance() == NotificationManager.IMPORTANCE_NONE) return false;
        }
        return true;
    }

    static void show(Context context, String subject) {
        channel(context);
        if (!allowed(context)) return;
        Intent intent = new Intent(context, MainActivity.class);
        intent.setFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        PendingIntent open = PendingIntent.getActivity(context, 0, intent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        Notification.Builder builder = Build.VERSION.SDK_INT >= 26 ? new Notification.Builder(context, CHANNEL) : new Notification.Builder(context);
        String title = subject == null ? "" : subject.replaceAll("[\\p{Cntrl}\\u202a-\\u202e\\u2066-\\u2069]", " ").trim();
        if (title.length() > 160) title = title.substring(0, 160);
        Notification.Builder hidden = Build.VERSION.SDK_INT >= 26 ? new Notification.Builder(context, CHANNEL) : new Notification.Builder(context);
        hidden.setSmallIcon(R.drawable.ic_mail_notification).setContentTitle("NewSzxcn").setContentText("收到新邮件");
        builder.setSmallIcon(R.drawable.ic_mail_notification).setContentTitle(title.isEmpty() ? "NewSzxcn" : title)
            .setContentText("收到新邮件，点击查看").setVisibility(Notification.VISIBILITY_PRIVATE)
            .setPublicVersion(hidden.build()).setContentIntent(open).setAutoCancel(true);
        try { context.getSystemService(NotificationManager.class).notify(1001, builder.build()); }
        catch (SecurityException ignored) { /* Permission may be revoked between check and notify. */ }
    }
}

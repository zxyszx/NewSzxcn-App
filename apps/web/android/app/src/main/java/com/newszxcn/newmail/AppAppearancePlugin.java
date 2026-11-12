package com.newszxcn.newmail;

import android.graphics.Color;
import android.content.res.Configuration;
import android.os.Build;
import android.view.Window;
import androidx.core.view.WindowCompat;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "AppAppearance")
public class AppAppearancePlugin extends Plugin {
    private Boolean currentDark;

    @Override protected void handleOnConfigurationChanged(Configuration configuration) {
        super.handleOnConfigurationChanged(configuration);
        // Apply after Capacitor's SystemBars configuration callback.
        getActivity().getWindow().getDecorView().post(() -> {
            if (currentDark != null) applyTheme(currentDark);
        });
    }

    @PluginMethod public void setTheme(PluginCall call) {
        boolean dark = Boolean.TRUE.equals(call.getBoolean("dark", false));
        getActivity().runOnUiThread(() -> {
            currentDark = dark;
            applyTheme(dark);
            call.resolve();
        });
    }

    private void applyTheme(boolean dark) {
        Window window = getActivity().getWindow();
        int background = dark ? Color.rgb(9, 9, 11) : Color.WHITE;
        // Capacitor pads this decor view for system insets. Its DayNight default
        // can differ from the theme explicitly selected inside the email UI.
        window.getDecorView().setBackgroundColor(background);
        window.setNavigationBarColor(background);
        window.setStatusBarColor(background);
        if (Build.VERSION.SDK_INT >= 29) window.setNavigationBarContrastEnforced(false);
        var controller = WindowCompat.getInsetsController(window, window.getDecorView());
        controller.setAppearanceLightStatusBars(!dark);
        // Android 7 has no dark navigation icons; retain contrast on that OS.
        if (Build.VERSION.SDK_INT >= 26) controller.setAppearanceLightNavigationBars(!dark);
        else window.setNavigationBarColor(Color.BLACK);
    }
}

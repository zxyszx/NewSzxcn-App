package com.newszxcn.newmail;

import com.getcapacitor.BridgeActivity;
import com.getcapacitor.BridgeWebViewClient;
import android.os.Bundle;
import android.webkit.CookieManager;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebView;
import androidx.activity.OnBackPressedCallback;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(MailNotificationsPlugin.class);
        super.onCreate(savedInstanceState);
        if (!bridge.getConfig().getPluginConfiguration("LiveMail").getBoolean("enabled", false)) return;
        AttachmentDownloads downloads = new AttachmentDownloads(this);
        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override public void handleOnBackPressed() {
                if (bridge.getWebView().canGoBack()) bridge.getWebView().goBack();
                else moveTaskToBack(true);
            }
        });
        CookieManager.getInstance().setAcceptCookie(true);
        CookieManager.getInstance().setAcceptThirdPartyCookies(bridge.getWebView(), false);
        bridge.setWebViewClient(new BridgeWebViewClient(bridge) {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                // Let WebView's HTTPS stack handle API bodies, TLS and HttpOnly cookies.
                // All application UI and scripts still come from the APK, not the website.
                if (LiveMailRouting.isRemoteApi(request.getUrl().toString())) return null;
                return super.shouldInterceptRequest(view, request);
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                if (request.isForMainFrame() && LiveMailRouting.isRemoteApi(request.getUrl().toString())) {
                    downloads.download(request.getUrl().toString());
                    return true;
                }
                return super.shouldOverrideUrlLoading(view, request);
            }
        });
        bridge.getWebView().setDownloadListener((url, userAgent, disposition, mimeType, length) -> downloads.download(url));
    }
}

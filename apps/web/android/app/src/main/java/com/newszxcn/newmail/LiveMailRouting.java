package com.newszxcn.newmail;

import java.net.URI;
import java.net.URISyntaxException;

final class LiveMailRouting {
    static final String HOST = "mail.newszxcn.com";

    static boolean isRemoteApi(String url) {
        try {
            URI uri = new URI(url);
            if (!"https".equals(uri.getScheme()) || !HOST.equals(uri.getHost()) || uri.getRawUserInfo() != null) return false;
            if (uri.getPort() != -1 && uri.getPort() != 443) return false;
            String path = uri.getPath();
            if (path == null || path.contains("\\")) return false;
            for (String segment : path.split("/")) {
                if (".".equals(segment) || "..".equals(segment)) return false;
            }
            return path.startsWith("/api/") || "/healthz".equals(path);
        } catch (URISyntaxException | NullPointerException e) {
            return false;
        }
    }

    static boolean isDownload(String url) {
        if (!isRemoteApi(url)) return false;
        String path = URI.create(url).getPath();
        return path.startsWith("/api/mail/attachments/") || path.startsWith("/api/admin/attachments/")
            || path.matches("/api/mail/external-accounts/[^/]+/attachments/.+") || "/api/mail/export".equals(path);
    }
}

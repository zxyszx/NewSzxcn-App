package com.newszxcn.newmail;

import org.junit.Test;
import static org.junit.Assert.*;

public class LiveMailRoutingTest {
    @Test public void allowsOnlyTrustedApiAndHealth() {
        assertTrue(LiveMailRouting.isRemoteApi("https://mail.newszxcn.com/api/auth/login"));
        assertTrue(LiveMailRouting.isRemoteApi("https://mail.newszxcn.com:443/api/mail/messages?folder=inbox"));
        assertTrue(LiveMailRouting.isRemoteApi("https://mail.newszxcn.com/api/events"));
        assertTrue(LiveMailRouting.isRemoteApi("https://mail.newszxcn.com/healthz"));
    }

    @Test public void rejectsOtherOriginsAssetsAndTraversal() {
        for (String url : new String[] {
            "http://mail.newszxcn.com/api/me", "https://mail.newszxcn.com:444/api/me",
            "https://mail.newszxcn.com.evil.test/api/me", "https://mail.newszxcn.com@evil.test/api/me",
            "https://user@mail.newszxcn.com/api/me", "https://other.test/api/me",
            "https://mail.newszxcn.com/assets/index.js", "https://mail.newszxcn.com/mail",
            "https://mail.newszxcn.com/api/../assets/app.js", "https://mail.newszxcn.com/api/%2e%2e/assets/app.js",
            "https://mail.newszxcn.com/api/%5c../assets/app.js", "not a url", "", null
        }) assertFalse(String.valueOf(url), LiveMailRouting.isRemoteApi(url));
    }

    @Test public void limitsDownloadsToAttachmentEndpoints() {
        assertTrue(LiveMailRouting.isDownload("https://mail.newszxcn.com/api/mail/attachments/att_1"));
        assertTrue(LiveMailRouting.isDownload("https://mail.newszxcn.com/api/mail/external-accounts/acc_1/attachments/12/1"));
        assertTrue(LiveMailRouting.isDownload("https://mail.newszxcn.com/api/mail/export?folder=inbox"));
        assertFalse(LiveMailRouting.isDownload("https://mail.newszxcn.com/api/auth/logout"));
        assertFalse(LiveMailRouting.isDownload("https://evil.test/api/mail/attachments/att_1"));
    }
}

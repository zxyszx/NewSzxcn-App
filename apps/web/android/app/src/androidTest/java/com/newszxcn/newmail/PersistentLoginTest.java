package com.newszxcn.newmail;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertTrue;

import android.app.Activity;
import android.app.Instrumentation;
import android.content.Intent;
import android.webkit.CookieManager;
import androidx.test.platform.app.InstrumentationRegistry;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import org.junit.Test;
import org.junit.Assume;

/** Run saveOnStop, force-stop the App, then run restoreAfterProcessDeath separately. */
public class PersistentLoginTest {
    private static final String ORIGIN = "https://session-persistence-test.invalid";
    private static final String COOKIE = "session_qa=synthetic-not-an-auth-token";

    @Test public void saveOnStop() throws Exception {
        Assume.assumeTrue("Run this test in two separate instrumented processes",
            "save".equals(InstrumentationRegistry.getArguments().getString("sessionPersistencePhase")));
        Instrumentation instrumentation = InstrumentationRegistry.getInstrumentation();
        Intent intent = new Intent(instrumentation.getTargetContext(), MainActivity.class);
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        Activity activity = instrumentation.startActivitySync(intent);
        CountDownLatch written = new CountDownLatch(1);
        instrumentation.runOnMainSync(() -> CookieManager.getInstance().setCookie(
            ORIGIN, COOKIE + "; Path=/; Max-Age=86400; Secure; HttpOnly", ignored -> written.countDown()));
        assertTrue("Cookie write did not complete", written.await(10, TimeUnit.SECONDS));
        assertEquals(COOKIE, CookieManager.getInstance().getCookie(ORIGIN));
        // MainActivity.onStop must persist the cookie; the test does not flush it.
        instrumentation.runOnMainSync(activity::finish);
        instrumentation.waitForIdleSync();
    }

    @Test public void restoreAfterProcessDeath() throws Exception {
        Assume.assumeTrue("Run this test in two separate instrumented processes",
            "restore".equals(InstrumentationRegistry.getArguments().getString("sessionPersistencePhase")));
        assertEquals("Persistent cookie was lost after process death", COOKIE,
            CookieManager.getInstance().getCookie(ORIGIN));
        CountDownLatch removed = new CountDownLatch(1);
        InstrumentationRegistry.getInstrumentation().runOnMainSync(() ->
            CookieManager.getInstance().setCookie(ORIGIN,
                "session_qa=; Path=/; Max-Age=0; Secure; HttpOnly", ignored -> removed.countDown()));
        assertTrue(removed.await(10, TimeUnit.SECONDS));
        CookieManager.getInstance().flush();
    }
}

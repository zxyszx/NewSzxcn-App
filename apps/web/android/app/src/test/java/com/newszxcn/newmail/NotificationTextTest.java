package com.newszxcn.newmail;

import org.junit.Test;
import static org.junit.Assert.assertEquals;

public class NotificationTextTest {
    @Test public void accountIsTitleAndSubjectIsBody() {
        assertEquals("收件箱 · inbox@example.test", NotificationText.title("inbox@example.test", "Test subject"));
        assertEquals("Test subject", NotificationText.body("inbox@example.test", "Test subject"));
    }

    @Test public void missingPreviewAndOlderServersHaveFallbacks() {
        assertEquals("NewSzxcn", NotificationText.title("", ""));
        assertEquals("收到新邮件", NotificationText.body("", ""));
        assertEquals("Old server subject", NotificationText.title("", "Old server subject"));
        assertEquals("（无主题）", NotificationText.body("inbox@example.test", ""));
    }

    @Test public void textIsBoundedWithoutSplittingUnicodeCharacters() {
        assertEquals("Hello   world", NotificationText.clean("Hello\r\n\u202eworld", 160));
        assertEquals("\ud83d\udce7", NotificationText.clean("\ud83d\udce7tail", 1));
        assertEquals("", NotificationText.clean(null, 160));
    }
}

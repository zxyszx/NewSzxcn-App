package com.newszxcn.newmail;

import org.junit.Test;
import static org.junit.Assert.*;

public class PushMessagePolicyTest {
    private final String event = "0123456789abcdef0123456789abcdef";
    private final String binding = event + event;

    @Test public void acceptsOnlyCurrentSessionEvents() {
        assertTrue(PushMessagePolicy.accepts("new_mail", event, binding, binding));
        assertFalse(PushMessagePolicy.accepts("new_mail", event, binding, ""));
        assertFalse(PushMessagePolicy.accepts("new_mail", event, binding, binding.replace('a', 'b')));
        assertFalse(PushMessagePolicy.accepts("new_mail", event, null, binding));
    }

    @Test public void rejectsUntrustedTypesAndMalformedIdentifiers() {
        assertFalse(PushMessagePolicy.accepts(null, event, binding, binding));
        assertFalse(PushMessagePolicy.accepts("open_url", event, binding, binding));
        assertFalse(PushMessagePolicy.accepts("new_mail", null, binding, binding));
        assertFalse(PushMessagePolicy.accepts("new_mail", "https://evil.example", binding, binding));
        assertFalse(PushMessagePolicy.accepts("new_mail", event, "", ""));
    }
}

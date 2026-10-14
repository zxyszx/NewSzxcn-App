package com.newszxcn.newmail;

final class PushMessagePolicy {
    static boolean accepts(String type, String event, String binding, String expectedBinding) {
        return "new_mail".equals(type)
            && event != null && event.matches("[a-f0-9]{32}")
            && binding != null && binding.matches("[a-f0-9]{64}")
            && binding.equals(expectedBinding);
    }
}

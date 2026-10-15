package com.newszxcn.newmail;

final class NotificationText {
    static String clean(String value, int limit) {
        String text = value == null ? "" : value.replaceAll("[\\p{Cntrl}\\u202a-\\u202e\\u2066-\\u2069]", " ").trim();
        int count = text.codePointCount(0, text.length());
        return count > limit ? text.substring(0, text.offsetByCodePoints(0, limit)) : text;
    }

    static String title(String account, String subject) {
        return !account.isEmpty() ? account : (!subject.isEmpty() ? subject : "NewSzxcn");
    }

    static String body(String account, String subject) {
        return !account.isEmpty() ? (!subject.isEmpty() ? subject : "（无主题）") : "收到新邮件";
    }
}

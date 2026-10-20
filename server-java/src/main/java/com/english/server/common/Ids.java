package com.english.server.common;

import java.security.SecureRandom;

public final class Ids {
    private static final char[] ALPHABET = "0123456789abcdefghijklmnopqrstuvwxyz".toCharArray();
    private static final SecureRandom RANDOM = new SecureRandom();

    private Ids() {
    }

    public static String cuid() {
        long now = System.currentTimeMillis();
        StringBuilder id = new StringBuilder("c").append(Long.toString(now, 36));
        while (id.length() < 25) {
            id.append(ALPHABET[RANDOM.nextInt(ALPHABET.length)]);
        }
        return id.substring(0, 25);
    }
}

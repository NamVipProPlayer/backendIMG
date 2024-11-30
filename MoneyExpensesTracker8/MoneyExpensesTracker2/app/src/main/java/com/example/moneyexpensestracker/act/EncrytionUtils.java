package com.example.moneyexpensestracker.act;


import android.util.Base64;

import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;

public class EncrytionUtils {

    private static final String AES = "AES";

    // Generate a Secret Key
    public static SecretKey generateKey() throws Exception {
        KeyGenerator keyGenerator = KeyGenerator.getInstance(AES);
        keyGenerator.init(256); // AES-256
        return keyGenerator.generateKey();
    }

    // Encrypt the password
    public static String encrypt(String plainText, SecretKey secretKey) throws Exception {
        Cipher cipher = Cipher.getInstance(AES);
        cipher.init(Cipher.ENCRYPT_MODE, secretKey);
        byte[] encryptedBytes = cipher.doFinal(plainText.getBytes());
        return Base64.encodeToString(encryptedBytes, Base64.DEFAULT);
    }

    // Decrypt the password
    public static String decrypt(String encryptedText, SecretKey secretKey) throws Exception {
        Cipher cipher = Cipher.getInstance(AES);
        cipher.init(Cipher.DECRYPT_MODE, secretKey);
        byte[] decodedBytes = Base64.decode(encryptedText, Base64.DEFAULT);
        byte[] decryptedBytes = cipher.doFinal(decodedBytes);
        return new String(decryptedBytes);
    }

    // Save and Load Secret Key (Convert to/from String)
    public static String keyToString(SecretKey secretKey) {
        byte[] encodedKey = secretKey.getEncoded();
        return Base64.encodeToString(encodedKey, Base64.DEFAULT);
    }

    public static SecretKey stringToKey(String keyString) {
        byte[] decodedKey = Base64.decode(keyString, Base64.DEFAULT);
        return new SecretKeySpec(decodedKey, 0, decodedKey.length, AES);
    }
}
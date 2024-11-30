package com.example.moneyexpensestracker;

import android.content.Context;
import android.content.SharedPreferences;
import android.util.Base64;

import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;

public class function {
    private static final String PREFS_NAME = "CampusExpense";
    private static final String KEY_SECRET_KEY = "SecretKey";
    private static final String AES = "AES";

    public static void saveSecretKeyIfNotExists(Context context, SecretKey secretKey) {
        SharedPreferences sharedPreferences = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);

        // Kiểm tra xem KEY_SECRET_KEY đã tồn tại chưa
        if (!sharedPreferences.contains(KEY_SECRET_KEY)) {
            SharedPreferences.Editor editor = sharedPreferences.edit();

            // Chuyển SecretKey thành chuỗi Base64
            String keyString = Base64.encodeToString(secretKey.getEncoded(), Base64.DEFAULT);

            // Lưu vào SharedPreferences
            editor.putString(KEY_SECRET_KEY, keyString);
            editor.apply();
        }
    }
    // Lấy SecretKey từ SharedPreferences
    public static SecretKey getSecretKey(Context context) {
        SharedPreferences sharedPreferences = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);

        String keyString = sharedPreferences.getString(KEY_SECRET_KEY, null);
        if (keyString != null) {
            byte[] decodedKey = Base64.decode(keyString, Base64.DEFAULT);
            return new SecretKeySpec(decodedKey, 0, decodedKey.length, AES);
        }

        return null;
    }

}

package com.example.moneyexpensestracker.adapter;

import android.content.ContentValues;
import android.content.Context;
import android.database.sqlite.SQLiteDatabase;

import androidx.annotation.Nullable;

import com.example.moneyexpensestracker.helper.DatabaseSQLHelper;

public class ProfileAdapter extends DatabaseSQLHelper {
    public ProfileAdapter(@Nullable Context context) {
        super(context);

    }
    public boolean updateAccount(String userId, String newEmail) {
        SQLiteDatabase db = this.getWritableDatabase();
        ContentValues values = new ContentValues();
        values.put("email", newEmail); // Assuming the email column is named 'email'

        int rows = db.update("users", values, "id = ?", new String[]{userId});
        db.close();
        return rows > 0; // Returns true if at least one row was updated
    }

    // Method to update password
    public boolean updatePassword(String userId, String newPassword) {
        SQLiteDatabase db = this.getWritableDatabase();
        ContentValues values = new ContentValues();
        values.put("password", newPassword); // Assuming the password column is named 'password'

        int rows = db.update("users", values, "id = ?", new String[]{userId});
        db.close();
        return rows > 0; // Returns true if at least one row was updated
    }
}

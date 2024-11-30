package com.example.moneyexpensestracker.helper;

import android.content.ContentValues;
import android.content.Context;
import android.database.Cursor;
import android.database.sqlite.SQLiteDatabase;
import android.database.sqlite.SQLiteOpenHelper;

import androidx.annotation.Nullable;

import com.example.moneyexpensestracker.model.objExpense;

import org.json.JSONObject;

import java.util.ArrayList;

public class DatabaseSQLHelper extends SQLiteOpenHelper {

    private static final String DATABASE_NAME = "CAMPUSEXPENSEMANGER.db";
    private static final int DATA_VERSION = 3;

    // USER TABLE
    private static final String TABLE_USERS = "users";
    private static final String USER_ID = "id";
    private static final String USER_NAME = "usersName";
    private static final String USER_PASSWORD = "usersPassword";

    // EXPENSE TABLE
    private static final String TABLE_EXPENSE = "expense";


    public DatabaseSQLHelper(@Nullable Context context) {
        super(context, DATABASE_NAME, null, DATA_VERSION);
    }

    @Override
    public void onCreate(SQLiteDatabase sqLiteDatabase) {
        // Create Users Table
        String createUserTable = "CREATE TABLE " + TABLE_USERS + " (" +
                USER_ID + " INTEGER PRIMARY KEY AUTOINCREMENT, " +
                USER_NAME + " TEXT NOT NULL, " +
                USER_PASSWORD + " TEXT NOT NULL);";
        sqLiteDatabase.execSQL(createUserTable);

        String sql = "CREATE TABLE IF NOT EXISTS expense (" +
                "id INTEGER PRIMARY KEY AUTOINCREMENT, " +
                "type TEXT, " +
                "date TEXT, " +
                "amount INTEGER, " +
                "category TEXT, " +
                "note TEXT"+");";
        sqLiteDatabase.execSQL(sql);
    }

    @Override
    public void onUpgrade(SQLiteDatabase sqLiteDatabase, int oldVer, int newVer) {
        sqLiteDatabase.execSQL("DROP TABLE IF EXISTS " + TABLE_USERS);
        sqLiteDatabase.execSQL("DROP TABLE IF EXISTS " + TABLE_EXPENSE);
        onCreate(sqLiteDatabase);
    }

    // Function to register a new user
    public boolean registerUser(String username, String password) {
        SQLiteDatabase db = this.getWritableDatabase();
        ContentValues values = new ContentValues();
        values.put(USER_NAME, username);
        values.put(USER_PASSWORD, password);

        long result = db.insert(TABLE_USERS, null, values);
        return result != -1;
    }

    // Function to check user credentials
    public boolean checkUser(String username, String password) {
        SQLiteDatabase db = this.getReadableDatabase();
        String query = "SELECT * FROM " + TABLE_USERS + " WHERE " + USER_NAME + " = ? AND " + USER_PASSWORD + " = ?";
        Cursor cursor = db.rawQuery(query, new String[]{username, password});

        boolean exists = cursor.getCount() > 0;
        cursor.close();
        return exists;
    }
    // Function to change user password using userName
    public boolean changePassword(String userName, String newPassword) {
        SQLiteDatabase db = this.getWritableDatabase();
        ContentValues values = new ContentValues();
        values.put(USER_PASSWORD, newPassword);

        // Update based on userName
        int result = db.update(TABLE_USERS, values, USER_NAME + "=?", new String[]{userName});
        db.close();
        return result > 0; // Return true if the update was successful
    }

    // Function to change user name using userName as identifier
    public boolean changeAccount(String currentUserName, String newUsername) {
        SQLiteDatabase db = this.getWritableDatabase();
        ContentValues values = new ContentValues();
        values.put(USER_NAME, newUsername);

        // Update based on current userName
        int result = db.update(TABLE_USERS, values, USER_NAME + "=?", new String[]{currentUserName});
        db.close();
        return result > 0; // Return true if the update was successful
    }

    public Cursor getUserDetails(String username, String password) {
        SQLiteDatabase db = this.getReadableDatabase();
        String selection = USER_NAME + "=?";
        String[] selectionArgs = new String[]{username};

        if (password != null) {
            selection += " AND " + USER_PASSWORD + "=?";
            selectionArgs = new String[]{username, password};
        }

        return db.query(TABLE_USERS,
                new String[]{USER_NAME, USER_PASSWORD},
                selection,
                selectionArgs,
                null,
                null,
                null);
    }



    // Function to add an expense
    public boolean addExpense(objExpense objExpense) {
        SQLiteDatabase db = this.getWritableDatabase();
        ContentValues values = new ContentValues();
        values.put("type", objExpense.getType());
        values.put("date", objExpense.getDate());
        values.put("amount", objExpense.getAmount());
        values.put("category",objExpense.getCategory());
        values.put("note", objExpense.getNote());
        long result =-1;
try{
        result = db.insert(TABLE_EXPENSE, null, values);
    } catch (Exception e) {
        e.printStackTrace(); // Log any exceptions
    } finally {
        db.close();
    }
        return result != -1;
    }

    //Function to load data for currently selected day
    public ArrayList<objExpense> getExpensesByDate(String date) {
        SQLiteDatabase db = this.getReadableDatabase();
        ArrayList<objExpense> arr = new ArrayList<>();
        Cursor cursor = null;

        try {
            cursor = db.query(TABLE_EXPENSE,
                    null,
                    "date = ?", // Where clause
                    new String[]{date}, // Selection arguments
                    null,
                    null,
                    "id DESC"); // Sort order

            if (cursor != null && cursor.moveToFirst()) {
                do {
                    objExpense obj = new objExpense();
                    obj.setId(cursor.getInt(cursor.getColumnIndexOrThrow("id")));
                    obj.setType(cursor.getString(cursor.getColumnIndexOrThrow("type")));
                    obj.setAmount(cursor.getInt(cursor.getColumnIndexOrThrow("amount")));
                    obj.setDate(cursor.getString(cursor.getColumnIndexOrThrow("date")));
                    obj.setCategory(cursor.getString(cursor.getColumnIndexOrThrow("category")));
                    obj.setNote(cursor.getString(cursor.getColumnIndexOrThrow("note")));
                    arr.add(obj);
                } while (cursor.moveToNext());
            }
        } finally {
            if (cursor != null) {
                cursor.close();
            }
            db.close();
        }

        return arr;
    }

    // Function to get total expenses for a specific date as JSON
    public String getTotalExpensesForDateAsJson(String date) {
        SQLiteDatabase db = this.getReadableDatabase();
        JSONObject jsonResult = new JSONObject();
        Cursor cursor = null;

        String sql = "SELECT " +
                "(SELECT SUM(amount) FROM expense WHERE type = 'INCOME' AND date = ?) AS totalIncome, " +
                "(SELECT SUM(amount) FROM expense WHERE type = 'OUTCOME' AND date = ?) AS totalExpense";

        try {
            cursor = db.rawQuery(sql, new String[]{date, date});

            if (cursor != null && cursor.moveToFirst()) {
                int totalIncome = cursor.getInt(cursor.getColumnIndexOrThrow("totalIncome"));
                int totalExpense = cursor.getInt(cursor.getColumnIndexOrThrow("totalExpense"));

                jsonResult.put("totalIncome", totalIncome);
                jsonResult.put("totalExpense", totalExpense);
            }
        } catch (Exception e) {
            e.printStackTrace();
            try {
                jsonResult.put("error", e.getMessage());
            } catch (Exception jsonException) {
                jsonException.printStackTrace();
            }
        } finally {
            if (cursor != null) {
                cursor.close();
            }
            db.close();
        }

        return jsonResult.toString();
    }
    public ArrayList<objExpense> getExpensesByMonth(String yearMonth) {
        SQLiteDatabase db = this.getReadableDatabase();
        ArrayList<objExpense> arr = new ArrayList<>();
        Cursor cursor = null;

        try {
            // yearMonth format: "yyyy-MM"
            cursor = db.query(TABLE_EXPENSE,
                    null,
                    "date LIKE ?", // Matches dates like '2024-11%'
                    new String[]{yearMonth + "%"},
                    null, null,
                    "id DESC");

            if (cursor != null && cursor.moveToFirst()) {
                do {
                    objExpense obj = new objExpense();
                    obj.setId(cursor.getInt(cursor.getColumnIndexOrThrow("id")));
                    obj.setType(cursor.getString(cursor.getColumnIndexOrThrow("type")));
                    obj.setAmount(cursor.getInt(cursor.getColumnIndexOrThrow("amount")));
                    obj.setDate(cursor.getString(cursor.getColumnIndexOrThrow("date")));
                    obj.setCategory(cursor.getString(cursor.getColumnIndexOrThrow("category")));
                    obj.setNote(cursor.getString(cursor.getColumnIndexOrThrow("note")));
                    arr.add(obj);
                } while (cursor.moveToNext());
            }
        } finally {
            if (cursor != null) {
                cursor.close();
            }
            db.close();
        }

        return arr;
    }


    // Function to delete an expense
    public boolean deleteExpense(int id) {
        SQLiteDatabase db = this.getWritableDatabase();
        int result = db.delete(TABLE_EXPENSE,
                "id" + "=?", new String[]{String.valueOf(id)});
        db.close();
        return result > 0;
    }

    // Function to retrieve all expenses
    public ArrayList<objExpense> getExpenses() {
        SQLiteDatabase db = this.getReadableDatabase();
        ArrayList<objExpense> arr = new ArrayList<>();
        Cursor cursor = null;

        try {
            cursor = db.query(TABLE_EXPENSE,
                    null, null, null, null, null,
                    "id" + " DESC");

            if (cursor != null && cursor.moveToFirst()) {
                do {
                    objExpense obj = new objExpense();
                    obj.setId(cursor.getInt(cursor.getColumnIndexOrThrow("id")));
                    obj.setType(cursor.getString(cursor.getColumnIndexOrThrow("type")));
                    obj.setAmount(cursor.getInt(cursor.getColumnIndexOrThrow("amount")));
                    obj.setDate(cursor.getString(cursor.getColumnIndexOrThrow("date")));
                    obj.setCategory(cursor.getString(cursor.getColumnIndexOrThrow("category")));
                    obj.setNote(cursor.getString(cursor.getColumnIndexOrThrow("note")));
                    arr.add(obj);
                } while (cursor.moveToNext());
            }
        } finally {
            if (cursor != null) {
                cursor.close();
            }
            db.close();
        }

        return arr;
    }
    public String getTotalExpensesForMonthAsJson(String yearMonth) {
        SQLiteDatabase db = this.getReadableDatabase();
        JSONObject jsonResult = new JSONObject();
        Cursor cursor = null;

        String sql = "SELECT " +
                "(SELECT SUM(amount) FROM expense WHERE type = 'INCOME' AND date LIKE ?) AS totalIncome, " +
                "(SELECT SUM(amount) FROM expense WHERE type = 'OUTCOME' AND date LIKE ?) AS totalExpense";

        try {
            cursor = db.rawQuery(sql, new String[]{yearMonth + "%", yearMonth + "%"});

            if (cursor != null && cursor.moveToFirst()) {
                int totalIncome = cursor.getInt(cursor.getColumnIndexOrThrow("totalIncome"));
                int totalExpense = cursor.getInt(cursor.getColumnIndexOrThrow("totalExpense"));

                jsonResult.put("totalIncome", totalIncome);
                jsonResult.put("totalExpense", totalExpense);
            }
        } catch (Exception e) {
            e.printStackTrace();
            try {
                jsonResult.put("error", e.getMessage());
            } catch (Exception jsonException) {
                jsonException.printStackTrace();
            }
        } finally {
            if (cursor != null) {
                cursor.close();
            }
            db.close();
        }

        return jsonResult.toString();
    }

    // Function to get total expenses as JSON
    public String getTotalExpensesAsJson() {
        SQLiteDatabase db = this.getReadableDatabase();
        JSONObject jsonResult = new JSONObject();
        Cursor cursor = null;

        String sql = "SELECT " +
                "(SELECT SUM(amount) FROM expense WHERE type = 'INCOME') AS totalIncome, " +
                "(SELECT SUM(amount) FROM expense WHERE type = 'OUTCOME') AS totalExpense";
        try {
            cursor = db.rawQuery(sql, null);

            if (cursor != null && cursor.moveToFirst()) {
                int totalIncome = cursor.getInt(cursor.getColumnIndexOrThrow("totalIncome"));
                int totalExpense = cursor.getInt(cursor.getColumnIndexOrThrow("totalExpense"));

                jsonResult.put("totalIncome", totalIncome);
                jsonResult.put("totalExpense", totalExpense);
            }
        } catch (Exception e) {
            e.printStackTrace();
            try {
                jsonResult.put("error", e.getMessage());
            } catch (Exception jsonException) {
                jsonException.printStackTrace();
            }
        } finally {
            if (cursor != null) {
                cursor.close();
            }
            db.close();
        }

        return jsonResult.toString();
    }
    public void insertSampleExpenses() {
        SQLiteDatabase db = this.getWritableDatabase();
        try {
            db.beginTransaction();

            for (int i = 1; i <= 100; i++) {
                ContentValues values = new ContentValues();
                values.put("type", i % 2 == 0 ? "INCOME" : "OUTCOME"); // Alternate between INCOME and OUTCOME
                values.put("date", "2024-11-" + (i % 30 + 1)); // Dates in November 2024
                values.put("amount", (i + 1) * 10); // Random amount
                values.put("category",
                        i % 7 == 0 ? "Food" :
                                i % 7 == 1 ? "Travel" :
                                        i % 7 == 2 ? "Shopping" :
                                                i % 7 == 3 ? "Drink" :
                                                        i % 7 == 4 ? "Gas" :
                                                                i % 7 == 5 ? "Sport" :
                                                                        "Salary" // Default case when i % 7 == 6
                );
                // Rotate categories
                values.put("note", "Note: " + i);

                db.insert(TABLE_EXPENSE, null, values);
            }

            db.setTransactionSuccessful();
        } catch (Exception e) {
            e.printStackTrace();
        } finally {
            db.endTransaction();
            db.close();
        }
    }

}

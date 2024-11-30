package com.example.moneyexpensestracker.act;



import android.content.Intent;
import android.os.Bundle;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;
import android.widget.RelativeLayout;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;

import com.example.moneyexpensestracker.function;
import com.example.moneyexpensestracker.helper.DatabaseSQLHelper;
import com.example.moneyexpensestracker.R;
import com.example.moneyexpensestracker.helper.DatabaseSQLHelper;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

import javax.crypto.SecretKey;

public class RegiterActivity extends AppCompatActivity {
    private EditText editTextUsername, editTextPassword;
    private RelativeLayout buttonRegister;
    private DatabaseSQLHelper dbHelper;
    private SecretKey existingkey;
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.acativity_register);
        try {
            // Use the same key from registration (load securely in production)
            // Lấy SecretKey từ SharedPreferences (nếu có)
            existingkey = function.getSecretKey(this);

            if (existingkey == null) {
                // Nếu chưa có SecretKey, tạo mới
                SecretKey newKey = EncrytionUtils.generateKey();
                // Lưu SecretKey vào SharedPreferences
                function.saveSecretKeyIfNotExists(this, newKey);
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        dbHelper = new DatabaseSQLHelper(this);

        editTextUsername = findViewById(R.id.txt_Email_Reg);
        editTextPassword = findViewById(R.id.txt_Password_Reg);
        buttonRegister = findViewById(R.id.btn_Regis);
        try {
            // Use the same key from registration (load securely in production)
            // Lấy SecretKey từ SharedPreferences (nếu có)
            existingkey = function.getSecretKey(this);

            if (existingkey == null) {
                // Nếu chưa có SecretKey, tạo mới
                SecretKey newKey = EncrytionUtils.generateKey();
                // Lưu SecretKey vào SharedPreferences
                function.saveSecretKeyIfNotExists(this, newKey);
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        buttonRegister.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                String username = editTextUsername.getText().toString().trim();
                String password = editTextPassword.getText().toString().trim();

                if (username.isEmpty()) {
                    editTextUsername.setError("Username is required");
                    editTextUsername.requestFocus();
                } else if (!isValidEmail(username)) {
                    editTextUsername.setError("Invalid username. Must be 4-20 characters, alphanumeric, and can include _ or .");
                    editTextUsername.requestFocus();
                } else if (password.isEmpty()) {
                    editTextPassword.setError("Password is required");
                    editTextPassword.requestFocus();
                } else {
                    try {
                        String encryptedPassword = EncrytionUtils.encrypt(password, existingkey);
                        boolean success = dbHelper.registerUser(username, encryptedPassword);
                        if (success) {
                            Toast.makeText(RegiterActivity.this, "Registration successful", Toast.LENGTH_SHORT).show();
                            startActivity(new Intent(RegiterActivity.this, LoginActivity.class));
                            finish();
                        } else {
                            Toast.makeText(RegiterActivity.this, "Registration failed", Toast.LENGTH_SHORT).show();
                        }
                    } catch (Exception ex) {
                        ex.printStackTrace();
                    }
                }
            }
        });



    }
    public static boolean isValidEmail(String username) {
        // Define the regex for email validation
        String regex = "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$";

        // Compile the regex into a pattern
        Pattern pattern = Pattern.compile(regex);

        // Match the input email against the pattern
        Matcher matcher = pattern.matcher(username);

        // Return whether the email matches the regex
        return matcher.matches();
    }

}


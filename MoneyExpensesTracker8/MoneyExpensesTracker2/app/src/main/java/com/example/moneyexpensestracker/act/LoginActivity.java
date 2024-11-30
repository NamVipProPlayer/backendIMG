package com.example.moneyexpensestracker.act;



import android.content.Intent;
import android.os.Bundle;
import android.util.Log;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.RelativeLayout;
import android.widget.TextView;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;

import com.example.moneyexpensestracker.function;
import com.example.moneyexpensestracker.helper.DatabaseSQLHelper;
import com.example.moneyexpensestracker.MainActivity;
import com.example.moneyexpensestracker.R;
import com.example.moneyexpensestracker.helper.DatabaseSQLHelper;
import com.example.moneyexpensestracker.ui.ProfileFragment.ProfileFragment;

import javax.crypto.SecretKey;

public class LoginActivity extends AppCompatActivity {
    private EditText editTextUsername, editTextPassword;
    private TextView Register;
    private RelativeLayout buttonLogin;
    private DatabaseSQLHelper dbHelper;
    ProfileFragment binding;
    private SecretKey existingKey;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_login);

        dbHelper = new DatabaseSQLHelper(this);

        editTextUsername = findViewById(R.id.txt_Email);
        editTextPassword = findViewById(R.id.txt_Password);
        buttonLogin = findViewById(R.id.btn_Confirm);
        Register = findViewById(R.id.regis);
        try {
            // Use the same key from registration (load securely in production)
            // Lấy SecretKey từ SharedPreferences (nếu có)
            existingKey = function.getSecretKey(this);

            if (existingKey == null) {
                // Nếu chưa có SecretKey, tạo mới
                SecretKey newKey = EncrytionUtils.generateKey();
                // Lưu SecretKey vào SharedPreferences
                function.saveSecretKeyIfNotExists(this, newKey);
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        buttonLogin.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                String username = editTextUsername.getText().toString().trim();
                String password = editTextPassword.getText().toString().trim();


                if (username.isEmpty() || password.isEmpty()) {
                    Toast.makeText(LoginActivity.this, "Please fill all fields", Toast.LENGTH_SHORT).show();
                } else {
                    try {
                        // Fetch the encrypted password from the database
                        String encryptedPassword = EncrytionUtils.encrypt(password, existingKey);
                        Log.i("Login",encryptedPassword);
                        boolean validUser = dbHelper.checkUser(username, encryptedPassword);
                        if (validUser) {
                            Toast.makeText(LoginActivity.this, "Login successful", Toast.LENGTH_SHORT).show();
                            startActivity(new Intent(LoginActivity.this, MainActivity.class));
                            // Pass username and password via Intent
                            Intent intent = new Intent(LoginActivity.this, MainActivity.class);
                            intent.putExtra("USERNAME", username);
                            intent.putExtra("PASSWORD", password);
                            startActivity(intent);
                            finish();
                        } else {
                            Toast.makeText(LoginActivity.this, "Invalid username or password", Toast.LENGTH_SHORT).show();
                        }
                    } catch (Exception ex) {
                        ex.printStackTrace();
                    }

                }
            }
        });
        Register.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                startActivity(new Intent(LoginActivity.this, RegiterActivity.class));
            }
        });
    }
}



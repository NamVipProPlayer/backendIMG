package com.example.moneyexpensestracker.ui.ProfileFragment;

import android.app.AlertDialog;
import android.content.Intent;
import android.database.Cursor;
import android.os.Bundle;
import android.text.TextUtils;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;

import com.example.moneyexpensestracker.act.LoginActivity;
import com.example.moneyexpensestracker.act.RegiterActivity;
import com.example.moneyexpensestracker.databinding.FragmentHomeBinding;
import com.example.moneyexpensestracker.databinding.FragmentProfileBinding;
import com.example.moneyexpensestracker.helper.DatabaseSQLHelper;

public class ProfileFragment extends Fragment {
    FragmentProfileBinding binding;
    private DatabaseSQLHelper databaseHelper; // Declare DatabaseHelper instance
    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, ViewGroup container, Bundle savedInstanceState) {
        // Inflate the fragment layout using view binding
        binding = FragmentProfileBinding.inflate(inflater, container, false);
        // Initialize DatabaseHelper
        databaseHelper = new DatabaseSQLHelper(getContext());


        // Get arguments from Bundle
        Bundle bundle = getArguments();
        if (bundle != null) {
            String username = bundle.getString("USERNAME");
            String password = bundle.getString("PASSWORD");
            loadUserData(username);
//            // Display data
//            binding.UserNameProfile.setText(username);
//            binding.passWordProfile.setText(password);
        }


        // Handle confirm button click
        binding.txtViewConfirmChange.setOnClickListener(v -> {
            String newPassword = binding.editTxtChangePassword.getText().toString();
            String newAccount = binding.editTxtChangeAccount.getText().toString();

            // Validate input and update information
            if (TextUtils.isEmpty(newPassword) && TextUtils.isEmpty(newAccount)) {
                Toast.makeText(getContext(), "Please enter new details to update.", Toast.LENGTH_SHORT).show();
            } else {
                if (!TextUtils.isEmpty(newPassword)) {
                    boolean success = changePassword(newPassword);
                    if (success) {
                        Toast.makeText(getContext(), "Password updated successfully.", Toast.LENGTH_SHORT).show();
                    } else {
                        Toast.makeText(getContext(), "Failed to update password.", Toast.LENGTH_SHORT).show();
                    }
                }
                if (!TextUtils.isEmpty(newAccount)) {
                    boolean success = changeAccount(newAccount);
                    if (success) {
                        Toast.makeText(getContext(), "Account updated successfully.", Toast.LENGTH_SHORT).show();
                    } else {
                        Toast.makeText(getContext(), "Failed to update account.", Toast.LENGTH_SHORT).show();
                    }
                }
            }
        });
        binding.txtViewSignout.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                String username = bundle.getString("USERNAME");
                new AlertDialog.Builder(requireContext())
                        .setTitle("Sign out this account: " + username)
                        .setMessage("Are you sure you want to sign out of this account?")
                        .setPositiveButton("Yes", (dialog, which) -> {

                            // Redirect to LoginActivity and clear activity stack
                            Intent intent = new Intent(requireContext(), LoginActivity.class);
                            //start new task and clear back task make user can't turn back after
                            //click confirm sign out
                            intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
                            startActivity(intent);
                        })
                        .setNegativeButton("No", null)
                        .show();
            }
        });



        return binding.getRoot();
    }
    private boolean changePassword(String newPassword) {
        // Call DatabaseHelper to update password
        String userName = binding.UserNameProfile.getText().toString().trim();

        return databaseHelper.changePassword(userName, newPassword);
    }

    private boolean changeAccount(String newEmail) {
        // Call DatabaseHelper to update account
        String passWord = binding.passWordProfile.getText().toString().trim();
        return databaseHelper.changeAccount(passWord, newEmail);
    }

    private void loadUserData(String username) {
        DatabaseSQLHelper dbHelper = new DatabaseSQLHelper(getContext());
        Cursor cursor = dbHelper.getUserDetails(username, null);

        if (cursor != null && cursor.moveToFirst()) {
            String userName = cursor.getString(cursor.getColumnIndexOrThrow("usersName"));
            String userPassword = cursor.getString(cursor.getColumnIndexOrThrow("usersPassword"));

            // Update UI components
            binding.UserNameProfile.setText(userName);
            binding.gmailProfile.setText(userName); // Replace with actual email from database if available
            binding.passWordProfile.setText(userPassword); // Mask password
            cursor.close();
        } else {
            Toast.makeText(getContext(), "Unable to load user data.", Toast.LENGTH_SHORT).show();
        }
    }

    @Override
    public void onDestroyView() {
        super.onDestroyView();
        binding = null;
    }
}

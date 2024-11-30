package com.example.moneyexpensestracker.ui;

import android.app.AlertDialog;
import android.app.DatePickerDialog;
import android.content.DialogInterface;
import android.os.Bundle;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.GridLayoutManager;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Toast;

import com.example.moneyexpensestracker.MainActivity;
import com.example.moneyexpensestracker.R;
import com.example.moneyexpensestracker.adapter.CategoryAdapter;
import com.example.moneyexpensestracker.adapter.ExpenseAdapter;
import com.example.moneyexpensestracker.databinding.FragmentAddtransBinding;
import com.example.moneyexpensestracker.databinding.ListCategoryDialogBinding;
import com.example.moneyexpensestracker.helper.DatabaseSQLHelper;
import com.example.moneyexpensestracker.model.CategoryTrans;
import com.example.moneyexpensestracker.model.objExpense;
import com.example.moneyexpensestracker.ui.home.HomeFragment;
import com.google.android.material.bottomsheet.BottomSheetDialogFragment;

import org.json.JSONObject;

import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.concurrent.atomic.AtomicReference;

public class AddtransFragment extends BottomSheetDialogFragment {

    private ExpenseAdapter expenseAdapter;
    private FragmentAddtransBinding binding;
    private DatabaseSQLHelper databaseHelper;
    objExpense objExpense1;
    public AddtransFragment() { }

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        databaseHelper = new DatabaseSQLHelper(getContext());
    }

    @Override
    public View onCreateView(LayoutInflater inflater, ViewGroup container, Bundle savedInstanceState) {
        binding = FragmentAddtransBinding.inflate(inflater, container, false);

        setupListeners(inflater);
        return binding.getRoot();
    }
    @Override
    public void onDismiss(@NonNull DialogInterface dialog) {
        super.onDismiss(dialog);
        if (getParentFragment() instanceof HomeFragment) {
            ((HomeFragment) getParentFragment()).refreshData();
        }
    }

    private void setupListeners(LayoutInflater inflater) {
        AtomicReference<String> type = new AtomicReference<>();
        // Income Button
        binding.txtBtnIncome.setOnClickListener(view -> {
            binding.txtBtnIncome.setBackground(getContext().getDrawable(R.drawable.income_selecter));
            binding.txtBtnExpense.setBackground(getContext().getDrawable(R.drawable.selecter));
            binding.txtBtnExpense.setTextColor(getContext().getColor(R.color.default_color));
            binding.txtBtnIncome.setTextColor(getContext().getColor(R.color.green_color));
            type.set("INCOME");
        });

        // Expense Button
        binding.txtBtnExpense.setOnClickListener(view -> {
            binding.txtBtnExpense.setBackground(getContext().getDrawable(R.drawable.defaullt_selecter));
            binding.txtBtnIncome.setBackground(getContext().getDrawable(R.drawable.selecter));
            binding.txtBtnExpense.setTextColor(getContext().getColor(R.color.red_color));
            binding.txtBtnIncome.setTextColor(getContext().getColor(R.color.default_color));
            type.set("OUTCOME");
        });

        // Date Picker
        binding.date.setOnClickListener(view -> {
            DatePickerDialog datePickerDialog = new DatePickerDialog(getContext());
            datePickerDialog.setOnDateSetListener((datePicker, year, month, day) -> {
                Calendar calendar = Calendar.getInstance();
                calendar.set(year, month, day);

                SimpleDateFormat dateFormat = new SimpleDateFormat("yyyy-MM-dd");
                String dateToShow = dateFormat.format(calendar.getTime());

                binding.date.setText(dateToShow);
            });
            datePickerDialog.show();
        });

        // Category Picker
        binding.category.setOnClickListener(view -> {
            ListCategoryDialogBinding dialogBinding = ListCategoryDialogBinding.inflate(inflater);
            AlertDialog categoryDialog = new AlertDialog.Builder(getContext()).create();
            categoryDialog.setView(dialogBinding.getRoot());

            ArrayList<CategoryTrans> categoryTrans = new ArrayList<>();
            categoryTrans.add(new CategoryTrans("Food"));
            categoryTrans.add(new CategoryTrans("Business"));
            categoryTrans.add(new CategoryTrans("Sport"));
            categoryTrans.add(new CategoryTrans("Drinks"));
            categoryTrans.add(new CategoryTrans("Gas"));
            categoryTrans.add(new CategoryTrans("Tax"));
            categoryTrans.add(new CategoryTrans("Salary"));
            categoryTrans.add(new CategoryTrans("Casino"));
            categoryTrans.add(new CategoryTrans("Bitcoin"));
            categoryTrans.add(new CategoryTrans("Bank"));
            categoryTrans.add(new CategoryTrans("Payment"));

            CategoryAdapter categoryAdapter = new CategoryAdapter(getContext(), categoryTrans, categoryTrans1 -> {
                binding.category.setText(categoryTrans1.getCategoryName());
                categoryDialog.dismiss();
            });

            dialogBinding.recyclerViewListCate.setLayoutManager(new GridLayoutManager(getContext(), 1));
            dialogBinding.recyclerViewListCate.setAdapter(categoryAdapter);

            categoryDialog.show();
        });

        // Save Button
        binding.btnSaveTrans.setOnClickListener(view -> {
            // Fetch inputs
            String date = binding.date.getText().toString().trim();
            String amount = binding.amount.getText().toString().trim();
            String category = binding.category.getText().toString().trim();
            String note = binding.notes.getText().toString().trim();

            objExpense1 = new objExpense();
            objExpense1.setType(type.get());
            objExpense1.setDate(date);
            objExpense1.setAmount(Integer.parseInt(amount));
            objExpense1.setCategory(category);
            objExpense1.setNote(note);


            // Validate inputs
            if (validateInputs(type.get(),date, amount, category,note)) {
                try {
                    // Convert amount to integer
                    int amountValue = Integer.parseInt(amount);

                    // Save the transaction
                    boolean success = databaseHelper.addExpense(objExpense1);

                    if (success) {
                        showToast("Transaction saved successfully");
                        clearInputs();
                    } else {
                        showToast("Failed to save transaction");
                    }
                } catch (NumberFormatException e) {
                    showToast("Invalid amount entered");
                }
            }


        });

    }

    private void clearInputs() {
        binding.date.setText("");
        binding.amount.setText("");
        binding.category.setText("");
        binding.notes.setText("");
    }

    private boolean validateInputs(String type, String date, String amount, String category, String note) {
        boolean isValid = true;

        // Validate type
        if (type == null || type.isEmpty()) {
            showToast("Please select a transaction type (Income or Expense)");
            isValid = false;
        }

        // Validate date
        if (date.isEmpty()) {
            binding.date.setError("Please select a date");
            isValid = false;
        }

        // Validate amount
        if (amount.isEmpty()) {
            binding.amount.setError("Please enter an amount");
            isValid = false;
        } else {
            try {
                int amountValue = Integer.parseInt(amount);
                if (amountValue <= 0) {
                    binding.amount.setError("Amount must be greater than zero");
                    isValid = false;
                }
            } catch (NumberFormatException e) {
                binding.amount.setError("Please enter a valid number");
                isValid = false;
            }
        }

        // Validate category
        if (category.isEmpty()) {
            binding.category.setError("Please select a category");
            isValid = false;
        }

        return isValid;
    }

    private void showToast(String message) {
        Toast.makeText(requireContext(), message, Toast.LENGTH_SHORT).show();
    }
}

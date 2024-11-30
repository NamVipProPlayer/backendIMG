package com.example.moneyexpensestracker.ui.home;

import android.app.AlertDialog;
import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.Menu;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;
import androidx.recyclerview.widget.LinearLayoutManager;

import com.example.moneyexpensestracker.databinding.FragmentHomeBinding;
import com.example.moneyexpensestracker.helper.DatabaseSQLHelper;
import com.example.moneyexpensestracker.adapter.ExpenseAdapter;
import com.example.moneyexpensestracker.model.objExpense;
import com.example.moneyexpensestracker.ui.AddtransFragment;
import com.google.android.material.tabs.TabLayout;

import org.json.JSONObject;

import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.Date;

public class HomeFragment extends Fragment {

    private FragmentHomeBinding binding;
    private ExpenseAdapter expenseAdapter;
    private DatabaseSQLHelper dbHelper;
    private Calendar calendar;

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, ViewGroup container, Bundle savedInstanceState) {
        // Inflate the fragment layout using view binding
        binding = FragmentHomeBinding.inflate(inflater, container, false);
        return binding.getRoot();
    }

    @Override
    public void onViewCreated(@NonNull View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);

        // Initialize database helper
        dbHelper = new DatabaseSQLHelper(requireContext());
        dbHelper.insertSampleExpenses();
        // Set up RecyclerView and Adapter
        binding.listView.setLayoutManager(new LinearLayoutManager(requireContext()));
        expenseAdapter = new ExpenseAdapter(requireContext(), new ArrayList<>());
        binding.listView.setAdapter(expenseAdapter);

        // Initialize Calendar
        calendar = Calendar.getInstance();
        updateDate();

        // Load initial data
        loadData();
        loadTotals();

        // Set default tab to Summary
        binding.tabLayout5.getTabAt(1).select();

        // Set up tab selection listener
        binding.tabLayout5.addOnTabSelectedListener(new TabLayout.OnTabSelectedListener() {
            @Override
            public void onTabSelected(TabLayout.Tab tab) {
                if (tab.getPosition() == 1) {
                    // Summary Tab
                    loadData();
                    loadTotals();
                } else if (tab.getPosition() == 0) {
                    // Daily Tab
                    loadDataForDate(calendar.getTime());
                }
            }

            @Override
            public void onTabUnselected(TabLayout.Tab tab) {}

            @Override
            public void onTabReselected(TabLayout.Tab tab) {}
        });

        // Set up button click listeners
        binding.btnNext.setOnClickListener(c -> {
            calendar.add(Calendar.DATE, 1);
            updateDate();
            if (isDailyTabSelected()) {
                loadDataForDate(calendar.getTime());
            }
        });

        binding.btnPrev.setOnClickListener(c -> {
            calendar.add(Calendar.DATE, -1);
            updateDate();
            if (isDailyTabSelected()) {
                loadDataForDate(calendar.getTime());
            }
        });

        // Floating Action Button to add a transaction
        binding.floatingActionButton.setOnClickListener(c -> {
            new AddtransFragment().show(getChildFragmentManager(), null);
        });

        // Long-click to delete an item
        expenseAdapter.setOnItemLongClickListener(expense -> {
            new AlertDialog.Builder(requireContext())
                    .setTitle("Delete Expense")
                    .setMessage("Are you sure you want to delete this expense?")
                    .setPositiveButton("Yes", (dialog, which) -> {
                        dbHelper.deleteExpense(expense.getId());
                        loadData();
                        loadTotals();
                    })
                    .setNegativeButton("No", null)
                    .show();
        });
    }

    private void updateDate() {
        SimpleDateFormat dateFormat = new SimpleDateFormat("yyyy-MM-dd");
        binding.currentDateTxtView.setText(dateFormat.format(calendar.getTime()));
    }

    private boolean isDailyTabSelected() {
        return binding.tabLayout5.getSelectedTabPosition() == 1;
    }

    private void loadData() {
        ArrayList<objExpense> expenseList = dbHelper.getExpenses();
        expenseAdapter.updateData(new ArrayList<>());
        expenseAdapter.updateData(expenseList);
        loadTotals();
    }

    private void loadDataForDate(Date date) {
        SimpleDateFormat dateFormat = new SimpleDateFormat("yyyy-MM-dd");
        String selectedDate = dateFormat.format(date);

        ArrayList<objExpense> expenseList = dbHelper.getExpensesByDate(selectedDate);
        expenseAdapter.updateData(new ArrayList<>());
        expenseAdapter.updateData(expenseList);

        loadDailyTotals(selectedDate);
    }

    private void loadTotals() {
        try {
            String json = dbHelper.getTotalExpensesAsJson();
            JSONObject jsonObject = new JSONObject(json);

            int totalIncome = jsonObject.optInt("totalIncome", 0);
            int totalOutcome = jsonObject.optInt("totalExpense", 0);
            int balance = totalIncome - totalOutcome;

            binding.txtviewIncome.setText(String.valueOf(totalIncome));
            binding.txtviewExpense.setText(String.valueOf(totalOutcome));
            binding.txtviewTotal.setText(String.valueOf(balance));
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private void loadDailyTotals(String date) {
        try {
            String json = dbHelper.getTotalExpensesForDateAsJson(date);
            JSONObject jsonObject = new JSONObject(json);

            int totalIncome = jsonObject.optInt("totalIncome", 0);
            int totalOutcome = jsonObject.optInt("totalExpense", 0);
            int balance = totalIncome - totalOutcome;

            binding.txtviewIncome.setText(String.valueOf(totalIncome));
            binding.txtviewExpense.setText(String.valueOf(totalOutcome));
            binding.txtviewTotal.setText(String.valueOf(balance));
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    @Override
    public void onDestroyView() {
        super.onDestroyView();
        binding = null;
    }

    public void refreshData() {
        loadData();
    }
}

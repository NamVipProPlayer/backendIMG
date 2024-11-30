package com.example.moneyexpensestracker;

import android.content.Intent;
import android.os.Bundle;
import android.util.Log;
import android.view.Menu;
import android.view.MenuItem;
import android.widget.SearchView;

import androidx.activity.EdgeToEdge;
import androidx.annotation.NonNull;
import androidx.appcompat.app.AlertDialog;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.example.moneyexpensestracker.adapter.ExpenseAdapter;
import com.example.moneyexpensestracker.databinding.ActivityMainBinding;
import com.example.moneyexpensestracker.helper.DatabaseSQLHelper;
import com.example.moneyexpensestracker.model.objExpense;
import com.example.moneyexpensestracker.ui.AddtransFragment;
import com.example.moneyexpensestracker.ui.ProfileFragment.ProfileFragment;
import com.example.moneyexpensestracker.ui.home.HomeFragment;
import com.example.moneyexpensestracker.ui.notifications.NotificationsFragment;
import com.google.android.material.bottomnavigation.BottomNavigationItemView;
import com.google.android.material.bottomnavigation.BottomNavigationView;
import com.google.android.material.navigation.NavigationBarView;
import com.google.android.material.tabs.TabLayout;

import org.json.JSONObject;

import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.Date;

public class MainActivity extends AppCompatActivity implements NavSetup {
    private RecyclerView recyclerView;
    private ExpenseAdapter expenseAdapter;
    private DatabaseSQLHelper dbHelper;
    ActivityMainBinding binding;
    BottomNavigationView bottomNavigationView;
    HomeFragment fragmentmentHome= new HomeFragment();
    NotificationsFragment statsFregment=new NotificationsFragment();
    ProfileFragment profileFragment=new ProfileFragment();

    Calendar calendar;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        EdgeToEdge.enable(this);
        binding = ActivityMainBinding.inflate(getLayoutInflater());
        setContentView(binding.getRoot());


        setSupportActionBar(binding.toolbar);
        getSupportActionBar().setTitle("Transsaction");

        BottomNavigationView bottomNavigationView=binding.navView;
        // Get data from Intent
        Intent intent = getIntent();
        String username = intent.getStringExtra("USERNAME");
        String password = intent.getStringExtra("PASSWORD");

        // Pass data to ProfileFragment
        Bundle bundle = new Bundle();
        bundle.putString("USERNAME", username);
        bundle.putString("PASSWORD", password);
        profileFragment.setArguments(bundle);


        getSupportFragmentManager().beginTransaction().replace(R.id.fragment_container,fragmentmentHome).commit();

        bottomNavigationView.setOnItemSelectedListener(new NavigationBarView.OnItemSelectedListener() {
            @Override
            public boolean onNavigationItemSelected(@NonNull MenuItem item) {
                int id = item.getItemId();
                if (id == R.id.navigation_home) {
                    getSupportFragmentManager().beginTransaction().replace(R.id.fragment_container,fragmentmentHome).commit();
                    getSupportActionBar().setTitle("Transsaction");
                    return true;
                } else if (id == R.id.navigation_stats) {
                    getSupportFragmentManager().beginTransaction().replace(R.id.fragment_container,statsFregment).commit();
                    getSupportActionBar().setTitle("Statistic");
                    return true;
                } else if (id == R.id.navigation_profile) {
                    getSupportFragmentManager().beginTransaction().replace(R.id.fragment_container,profileFragment).commit();
                    getSupportActionBar().setTitle("Profile");
                    return true;
                } else {
                    return false;
                }
            }
        });

//
//        calendar=Calendar.getInstance();
//        updateDate();
//
//        binding.btnNext.setOnClickListener(c->{
//            calendar.add(Calendar.DATE, 1);
//            updateDate();
//            if (isDailyTabSelected()) {
//                loadDataForDate(calendar.getTime());
//            }
//        });
//
//        binding.btnPrev.setOnClickListener(c->{
//            calendar.add(Calendar.DATE, -1);
//            updateDate();
//            if (isDailyTabSelected()) {
//                loadDataForDate(calendar.getTime());
//            }
//        });
//        binding.floatingActionButton.setOnClickListener(c->{
//            new AddtransFragment().show(getSupportFragmentManager(),null);
//        });
//
//        // Initialize database helper
//        dbHelper = new DatabaseSQLHelper(this);
//
//        // Set up RecyclerView and Adapter
//        recyclerView = binding.listView; // Ensure this matches your RecyclerView's ID
//        recyclerView.setLayoutManager(new LinearLayoutManager(this));
//        expenseAdapter = new ExpenseAdapter(this, new ArrayList<>());
//        recyclerView.setAdapter(expenseAdapter);
//
//        // Load initial data
//        loadData();
//        loadTotals();
//        binding.tabLayout5.getTabAt(1).select();
//
//        //daily loaddata
//
//        // Set up tab selection listener
//        binding.tabLayout5.addOnTabSelectedListener(new TabLayout.OnTabSelectedListener() {
//            @Override
//            public void onTabSelected(TabLayout.Tab tab) {
//                if (tab.getPosition() == 1) {
//                    // Summary Tab
//                    loadData();
//                    loadTotals();
//                } else if (tab.getPosition() == 0) {
//                    // Daily Tab
//                    loadDataForDate(calendar.getTime());
//                }
//
//            }
//            @Override
//            public void onTabUnselected(TabLayout.Tab tab) {}
//
//            @Override
//            public void onTabReselected(TabLayout.Tab tab) {}
//        });
//        //Holding for delete item
//        expenseAdapter.setOnItemLongClickListener(expense -> {
//
//            // Show confirmation dialog
//            new AlertDialog.Builder(MainActivity.this)
//                    .setTitle("Delete Expense")
//                    .setMessage("Are you sure you want to delete this expense?")
//                    .setPositiveButton("Yes", (dialog, which) -> {
//                        dbHelper.deleteExpense(expense.getId());
//                        loadData();
//                        loadTotals();
//                    })
//                    .setNegativeButton("No", null)
//                    .show();
//        });


    }

    @Override
    public void EventBottomNav()
    {

    }
//
//    private void updateDate() {
//        SimpleDateFormat dateFormat =new SimpleDateFormat("yyyy-MM-dd");
//        binding.currentDateTxtView.setText(dateFormat.format(calendar.getTime()));
//    }
//    private boolean isDailyTabSelected() {
//        return binding.tabLayout5.getSelectedTabPosition() == 1;
//    }
//    @Override
//    public boolean onCreateOptionsMenu(Menu menu) {
//        // Inflate the menu
//        getMenuInflater().inflate(R.menu.top_menu, menu);
//
//        return super.onCreateOptionsMenu(menu);
//    }
//
//    private void searchByCategory(String category) {
//        // Fetch filtered data from the database
//        ArrayList<objExpense> filteredExpenses = dbHelper.getExpensesByCategory(category);
//
//        // If no results are found, show a message
//        if (filteredExpenses.isEmpty()) {
//            binding.currentDateTxtView.setText("No results found for category: " + category);
//        } else {
//            binding.currentDateTxtView.setText("Results for category: " + category);
//        }
//
//        // Update the adapter with the filtered data
//        expenseAdapter.updateData(filteredExpenses);
//        loadCategoryTotals(category);
//    }
//    private void loadCategoryTotals(String category) {
//        try {
//            String json = dbHelper.getTotalExpensesForCategoryAsJson(category);
//            JSONObject jsonObject = new JSONObject(json);
//
//            int totalIncome = jsonObject.optInt("totalIncome", 0);
//            int totalOutcome = jsonObject.optInt("totalExpense", 0);
//            int balance = totalIncome - totalOutcome;
//
//            binding.txtviewIncome.setText(String.valueOf(totalIncome));
//            binding.txtviewExpense.setText(String.valueOf(totalOutcome));
//            binding.txtviewTotal.setText(String.valueOf(balance));
//        } catch (Exception e) {
//            e.printStackTrace();
//        }
//    }
//    private void loadData() {
//        // Fetch data from database
//        ArrayList<objExpense> expenseList = dbHelper.getExpenses();
//
//        expenseAdapter.updateData(new ArrayList<>());
//        // Update the adapter
//        expenseAdapter.updateData(expenseList);
//        loadTotals();
//    }
//
//    private  void deleteItemView(){
//
//    }
//    private void loadTotals() {
//        try {
//            // Get totals as JSON from the database
//            String json = dbHelper.getTotalExpensesAsJson();
//            JSONObject jsonObject = new JSONObject(json);
//
//            int totalIncome = jsonObject.optInt("totalIncome", 0);
//            int totalOutcome = jsonObject.optInt("totalExpense", 0);
//            int balance = totalIncome - totalOutcome;
//
//            // Update UI
//            binding.txtviewIncome.setText(String.format(String.valueOf(totalIncome)));
//            binding.txtviewExpense.setText(String.format(String.valueOf(totalOutcome)));
//            binding.txtviewTotal.setText(String.format(String.valueOf(balance)));
//
//        } catch (Exception e) {
//            e.printStackTrace();
//        }
//    }
//    public void loadDataForDate(Date date) {
//        SimpleDateFormat dateFormat = new SimpleDateFormat("yyyy-MM-dd");
//        String selectedDate = dateFormat.format(date);
//
//        // Fetch expenses for the selected date
//        ArrayList<objExpense> expenseList = dbHelper.getExpensesByDate(selectedDate);
//
//        expenseAdapter.updateData(new ArrayList<>());
//        // Update the adapter with the filtered data
//        expenseAdapter.updateData(expenseList);
//
//       // Load totals for the selected date
//        loadDailyTotals(selectedDate);
//    }
//
//    private void loadDailyTotals(String date) {
//        try {
//            // Get daily totals as JSON from the database
//            String json = dbHelper.getTotalExpensesForDateAsJson(date);
//            JSONObject jsonObject = new JSONObject(json);
//
//            int totalIncome = jsonObject.optInt("totalIncome", 0);
//            int totalOutcome = jsonObject.optInt("totalExpense", 0);
//            int balance = totalIncome - totalOutcome;
//
//            // Update UI
//            binding.txtviewIncome.setText(String.valueOf(totalIncome));
//            binding.txtviewExpense.setText(String.valueOf(totalOutcome));
//            binding.txtviewTotal.setText(String.valueOf(balance));
//        } catch (Exception e) {
//            e.printStackTrace();
//        }
//    }
//


}
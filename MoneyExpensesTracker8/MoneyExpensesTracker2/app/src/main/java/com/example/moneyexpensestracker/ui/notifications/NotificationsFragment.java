package com.example.moneyexpensestracker.ui.notifications;

import android.app.DatePickerDialog;
import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.DatePicker;
import android.widget.TextView;
import android.widget.Toast;


import androidx.annotation.NonNull;
import androidx.fragment.app.Fragment;
import androidx.lifecycle.ViewModelProvider;


import com.example.moneyexpensestracker.databinding.FragmentStatsBinding;
import com.example.moneyexpensestracker.helper.DatabaseSQLHelper;
import com.example.moneyexpensestracker.model.objExpense;
import com.github.mikephil.charting.charts.BarChart;
import com.github.mikephil.charting.charts.PieChart;
import com.github.mikephil.charting.components.Description;
import com.github.mikephil.charting.components.XAxis;
import com.github.mikephil.charting.components.YAxis;
import com.github.mikephil.charting.data.BarData;
import com.github.mikephil.charting.data.BarDataSet;
import com.github.mikephil.charting.data.BarEntry;
import com.github.mikephil.charting.data.PieData;
import com.github.mikephil.charting.data.PieDataSet;
import com.github.mikephil.charting.data.PieEntry;
import com.github.mikephil.charting.utils.ColorTemplate;

import org.json.JSONObject;

import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class NotificationsFragment extends Fragment {
    private BarChart barChart;
    private PieChart pieChart;
    private DatabaseSQLHelper dbHelper;
    private FragmentStatsBinding binding;

    public View onCreateView(@NonNull LayoutInflater inflater,
                             ViewGroup container, Bundle savedInstanceState) {
        NotificationsViewModel notificationsViewModel =
                new ViewModelProvider(this).get(NotificationsViewModel.class);

        binding = FragmentStatsBinding.inflate(inflater, container, false);
        View root = binding.getRoot();
        //khoi tao database
        dbHelper = new DatabaseSQLHelper(getContext());

        pieChart = binding.chart1;
        barChart = binding.barChart;
        setupPieChart();
        setupBarChart();

        //PieChart
        binding.txtStartDate.setOnClickListener(v -> showDatePickerDialog(date -> {
            binding.txtStartDate.setText(date);
            ArrayList<objExpense> expenses = dbHelper.getExpensesByDate(date);
            updatePieChart(pieChart, expenses, "Expenses for " + date);
        }));
        binding.txtPieChartAll.setOnClickListener(v -> {
            ArrayList<objExpense> expenses = dbHelper.getExpenses();
            setupPieChart();
        });
        binding.txtPieChartmonth.setOnClickListener(v -> showMonthPickerDialog());
        //Baarchart
        binding.txtColumnChartAll.setOnClickListener(v -> {
            ArrayList<objExpense> expenses = dbHelper.getExpenses();
            updateBarChart(barChart, expenses, "Overall Expenses");
        });

        binding.txtBarChartMonth.setOnClickListener(v -> showMonthPickerDialogForBarChart());

        return root;
    }
    @Override
    public void onResume() {
        super.onResume();
        // Reload data every time the fragment is accessed
        loadBarChartData();
    }
    @Override
    public void onDestroyView() {
        super.onDestroyView();
        binding = null;
    }
    private void setupPieChart() {
        try {
            String jsonData = dbHelper.getTotalExpensesAsJson();
            JSONObject jsonObject = new JSONObject(jsonData);

            int totalIncome = jsonObject.optInt("totalIncome", 0);
            int totalExpense = jsonObject.optInt("totalExpense", 0);

            // Create entries for PieChart
            List<PieEntry> entries = new ArrayList<>();
            entries.add(new PieEntry(totalIncome, "Income"));
            entries.add(new PieEntry(totalExpense, "Outcome"));

            PieDataSet dataSet = new PieDataSet(entries, "Expenses");
            dataSet.setColors(ColorTemplate.MATERIAL_COLORS);
            dataSet.setValueTextSize(14f);

            PieData pieData = new PieData(dataSet);

            // Set data to chart
            pieChart.setData(pieData);

            // Customize PieChart
            Description description = new Description();
            description.setText("Income vs Outcome"); // Default description
            pieChart.setDescription(description);

            pieChart.setUsePercentValues(true);
            pieChart.setDrawHoleEnabled(true);
            pieChart.setHoleRadius(50f);
            pieChart.setTransparentCircleRadius(55f);

            pieChart.animateY(1000);
            pieChart.invalidate(); // Refresh chart
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private void updatePieChart(PieChart pieChart, ArrayList<objExpense> expenses, String filterType) {
        List<PieEntry> entries = new ArrayList<>();
        Map<String, Float> categoryTotals = new HashMap<>();

        // totals by category
        for (objExpense expense : expenses) {
            String category = expense.getCategory();
            float amount = expense.getAmount();
            categoryTotals.put(category, categoryTotals.getOrDefault(category, 0f) + amount);
        }

        // Prepare PieEntries
        for (Map.Entry<String, Float> entry : categoryTotals.entrySet()) {
            entries.add(new PieEntry(entry.getValue(), entry.getKey()));
        }

        // Set up pieChart
        PieDataSet dataSet = new PieDataSet(entries, "Expenses");
        dataSet.setColors(ColorTemplate.MATERIAL_COLORS);
        PieData data = new PieData(dataSet);

        pieChart.setData(data);

        // Set dynamic description
        Description description = new Description();
        description.setText(filterType); // Example: "Expenses for November 2024"
        pieChart.setDescription(description);

        pieChart.invalidate(); //refresh
    }

    private void showDatePickerDialog(OnDateSelectedListener listener) {
        Calendar calendar = Calendar.getInstance();
        int year = calendar.get(Calendar.YEAR);
        int month = calendar.get(Calendar.MONTH);
        int day = calendar.get(Calendar.DAY_OF_MONTH);

        DatePickerDialog datePickerDialog = new DatePickerDialog(
                requireContext(),
                (view, year1, month1, dayOfMonth) -> {
                    String selectedDate = year1 + "-" + (month1 + 1) + "-" + dayOfMonth;
                    listener.onDateSelected(selectedDate);
                },
                year, month, day
        );
        datePickerDialog.show();
    }

    interface OnDateSelectedListener {
        void onDateSelected(String date);
    }
    public void showMonthPickerDialog() {
        Calendar calendar = Calendar.getInstance();
        int currentYear = calendar.get(Calendar.YEAR);
        int currentMonth = calendar.get(Calendar.MONTH);

        DatePickerDialog datePickerDialog = new DatePickerDialog(
                getContext(),
                new DatePickerDialog.OnDateSetListener() {
                    @Override
                    public void onDateSet(DatePicker view, int year, int monthOfYear, int dayOfMonth) {
                        // Only take the year and month, not the day
                        String yearMonth = year + "-" + String.format("%02d", (monthOfYear + 1));
                        onMonthSelected(yearMonth);
                    }
                },
                currentYear,
                currentMonth,
                1 // Placeholder for day
        );

        // Hide the day picker spinner
        try {
            DatePicker datePicker = datePickerDialog.getDatePicker();

            // For newer versions of Android
            int daySpinnerId = getResources().getIdentifier("day", "id", "android");
            if (daySpinnerId != 0) {
                View daySpinner = datePicker.findViewById(daySpinnerId);
                if (daySpinner != null) {
                    daySpinner.setVisibility(View.GONE);
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }

        datePickerDialog.show();
    }
    private void onMonthSelected(String yearMonth) {
        // Get expenses for the selected month and update the PieChart
        ArrayList<objExpense> expenses = dbHelper.getExpensesByMonth(yearMonth);
        updatePieChart(pieChart, expenses,yearMonth);
    }
    private void setupBarChart() {
        barChart.setDrawBarShadow(false);
        barChart.setDrawValueAboveBar(true);
        barChart.setMaxVisibleValueCount(50);
        barChart.setPinchZoom(false);
        barChart.setDrawGridBackground(false);

        // Configure chart description
        barChart.getDescription().setEnabled(true);
        barChart.getDescription().setTextSize(12f);

        // Configure X-Axis
        XAxis xAxis = barChart.getXAxis();
        xAxis.setGranularity(1f);
        xAxis.setPosition(XAxis.XAxisPosition.BOTTOM);
        xAxis.setDrawGridLines(false);

        // Configure Y-Axis
        YAxis leftAxis = barChart.getAxisLeft();
        leftAxis.setDrawGridLines(true);
        leftAxis.setSpaceTop(15f);
        leftAxis.setAxisMinimum(0f); // Start at 0

        barChart.getAxisRight().setEnabled(false); // Disable right axis
    }

    private void loadBarChartData() {
        // Retrieve data from database
        ArrayList<BarEntry> entries = new ArrayList<>();
        ArrayList<objExpense> expenses = dbHelper.getExpensesByMonth("2024-11"); // Example: November 2024

        for (int i = 0; i < expenses.size(); i++) {
            // Using index as X-value and amount as Y-value
            entries.add(new BarEntry(i, expenses.get(i).getAmount()));
        }

        // Check if data is available
        if (entries.isEmpty()) {
            barChart.clear();
            barChart.invalidate();
            return;
        }

        // Create a BarDataSet
        BarDataSet dataSet = new BarDataSet(entries, "Expenses");
        dataSet.setColors(ColorTemplate.MATERIAL_COLORS);
        dataSet.setValueTextSize(10f);

        // Create BarData and set it to the chart
        BarData data = new BarData(dataSet);
        data.setBarWidth(0.9f); // Set bar width
        barChart.setData(data);

        // Refresh and animate the chart
        barChart.animateY(1000);
        barChart.invalidate();
    }
    private void updateBarChart(BarChart barChart, ArrayList<objExpense> expenses, String filterType) {
        List<BarEntry> entries = new ArrayList<>();
        Map<String, Float> categoryTotals = new HashMap<>();

        // Aggregate totals by category
        for (objExpense expense : expenses) {
            String category = expense.getCategory();
            float amount = expense.getAmount();
            categoryTotals.put(category, categoryTotals.getOrDefault(category, 0f) + amount);
        }

        // Prepare BarEntries
        int index = 0;
        for (Map.Entry<String, Float> entry : categoryTotals.entrySet()) {
            entries.add(new BarEntry(index++, entry.getValue()));
        }

        BarDataSet dataSet = new BarDataSet(entries, "Expenses");
        dataSet.setColors(ColorTemplate.MATERIAL_COLORS);
        BarData data = new BarData(dataSet);

        barChart.setData(data);

        // Set dynamic description
        Description description = new Description();
        description.setText(filterType); // e.g., "Monthly Expenses for November"
        barChart.setDescription(description);

        barChart.invalidate(); // Refresh the chart
    }
    private void showMonthPickerDialogForBarChart() {
        Calendar calendar = Calendar.getInstance();
        int currentYear = calendar.get(Calendar.YEAR);
        int currentMonth = calendar.get(Calendar.MONTH);

        DatePickerDialog datePickerDialog = new DatePickerDialog(
                getContext(),
                (view, year, monthOfYear, dayOfMonth) -> {
                    // Format: YYYY-MM
                    String yearMonth = year + "-" + String.format("%02d", (monthOfYear + 1));
                    onBarChartMonthSelected(yearMonth);
                },
                currentYear,
                currentMonth,
                1
        );

        // Hide the day spinner
        try {
            DatePicker datePicker = datePickerDialog.getDatePicker();
            int daySpinnerId = getResources().getIdentifier("day", "id", "android");
            if (daySpinnerId != 0) {
                View daySpinner = datePicker.findViewById(daySpinnerId);
                if (daySpinner != null) {
                    daySpinner.setVisibility(View.GONE);
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }

        datePickerDialog.show();
    }

    private void onBarChartMonthSelected(String yearMonth) {
        ArrayList<objExpense> expenses = dbHelper.getExpensesByMonth(yearMonth);
        updateBarChart(barChart, expenses, "Expenses for " + yearMonth);
    }



}
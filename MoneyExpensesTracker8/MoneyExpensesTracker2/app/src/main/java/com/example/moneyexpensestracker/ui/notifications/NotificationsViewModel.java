package com.example.moneyexpensestracker.ui.notifications;

import androidx.lifecycle.LiveData;
import androidx.lifecycle.MutableLiveData;
import androidx.lifecycle.ViewModel;

import com.example.moneyexpensestracker.helper.DatabaseSQLHelper;
import com.github.mikephil.charting.charts.PieChart;

public class NotificationsViewModel extends ViewModel {
    private PieChart pieChart;
    private DatabaseSQLHelper dbHelper;
    private final MutableLiveData<String> mText;

    public NotificationsViewModel() {
        mText = new MutableLiveData<>();
        mText.setValue("This is notifications fragment");
    }

    public LiveData<String> getText() {
        return mText;
    }

}
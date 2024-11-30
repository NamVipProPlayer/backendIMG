package com.example.moneyexpensestracker.adapter;

import android.content.Context;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;
import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import com.example.moneyexpensestracker.R;
import com.example.moneyexpensestracker.model.objExpense;

import java.util.ArrayList;

public class ExpenseAdapter extends RecyclerView.Adapter<ExpenseAdapter.ExpenseViewHolder> {

    private Context context;
    private ArrayList<objExpense> expenses;
    private OnItemLongClickListener longClickListener;

    public ExpenseAdapter(Context context, ArrayList<objExpense> expenses) {
        this.context = context;
        this.expenses = expenses;
    }

    @NonNull
    @Override
    public ExpenseViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        // Inflate the layout for individual rows
        View view = LayoutInflater.from(context).inflate(R.layout.trans_row, parent, false);
        return new ExpenseViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull ExpenseViewHolder holder, int position) {
        // Get the expense at the current position
        objExpense expense = expenses.get(position);

        // Bind data to the respective views
        holder.categoryTextView.setText(expense.getCategory());
        holder.dateTextView.setText(expense.getDate());
        holder.amountTextView.setText(String.format("$%d", expense.getAmount()));
        holder.typeTextView.setText(expense.getType());
        holder.noteTextView.setText(expense.getNote());

        // Set up a long-click listener
        holder.itemView.setOnLongClickListener(view -> {
            if (longClickListener != null) {
                longClickListener.onItemLongClick(expense);
                return true;
            }
            return false;
        });
    }

    @Override
    public int getItemCount() {
        return expenses.size();
    }

    // ViewHolder class for caching view references
    public static class ExpenseViewHolder extends RecyclerView.ViewHolder {
        TextView categoryTextView, dateTextView, amountTextView, typeTextView,noteTextView;

        public ExpenseViewHolder(@NonNull View itemView) {
            super(itemView);

            // Find views by their IDs
            categoryTextView = itemView.findViewById(R.id.txtView_category);
            dateTextView = itemView.findViewById(R.id.txtView_date);
            amountTextView = itemView.findViewById(R.id.txtView_amount);
            typeTextView = itemView.findViewById(R.id.txtView_type);
            noteTextView = itemView.findViewById(R.id.txtView_trans_note);
        }
    }

    // Method to update the dataset dynamically
    public void updateData(ArrayList<objExpense> newData) {
        // Clear the current list and add the new data
        expenses.clear();
        expenses.addAll(newData);

        // Notify the adapter about the dataset change
        notifyDataSetChanged();
    }

    // Interface for long-click handling
    public interface OnItemLongClickListener {
        void onItemLongClick(objExpense expense);
    }

    // Set the long-click listener
    public void setOnItemLongClickListener(OnItemLongClickListener listener) {
        this.longClickListener = listener;
    }

}

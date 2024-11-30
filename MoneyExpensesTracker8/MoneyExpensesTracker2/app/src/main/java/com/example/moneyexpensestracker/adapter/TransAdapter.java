package com.example.moneyexpensestracker.adapter;

import android.view.View;
import android.view.ViewGroup;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import com.example.moneyexpensestracker.databinding.TransRowBinding;

public class TransAdapter extends RecyclerView.Adapter<TransAdapter.TransViewHolder> {

    @NonNull
    @Override
    public TransViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        return null;
    }

    @Override
    public void onBindViewHolder(@NonNull TransViewHolder holder, int position) {

    }

    @Override
    public int getItemCount() {
        return 0;
    }

    public class TransViewHolder extends RecyclerView.ViewHolder{

        TransRowBinding binding;

        public TransViewHolder(@NonNull View itemView) {
            super(itemView);
            binding = TransRowBinding.bind(itemView);
        }
    }

}

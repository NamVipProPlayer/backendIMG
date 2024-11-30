package com.example.moneyexpensestracker.adapter;

import android.content.Context;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import com.example.moneyexpensestracker.R;
import com.example.moneyexpensestracker.databinding.CategorySampleBinding;
import com.example.moneyexpensestracker.model.CategoryTrans;

import java.util.ArrayList;

public class CategoryAdapter extends RecyclerView.Adapter<CategoryAdapter.CategoryViewHolder> {

   Context context;
   ArrayList<CategoryTrans> categories;

   public interface CategoryClickListener{
       void  onCatagoryClicked(CategoryTrans categoryTrans);
   }
   CategoryClickListener categoryClickListener;

   public CategoryAdapter(Context context, ArrayList<CategoryTrans> categories,CategoryClickListener categoryClickListener){
       this.categories=categories;
       this.context=context;
       this.categoryClickListener=categoryClickListener;
   }

    @NonNull
    @Override
    public CategoryViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        return new CategoryViewHolder(LayoutInflater.from(context).inflate(R.layout.category_sample,parent,false));
    }

    @Override
    public void onBindViewHolder(@NonNull CategoryViewHolder holder, int position) {
        CategoryTrans categoryTrans = categories.get(position);
        holder.binding.txtViewCategory.setText(categoryTrans.getCategoryName());

        holder.itemView.setOnClickListener(c->{
            categoryClickListener.onCatagoryClicked(categoryTrans);
        });
    }

    @Override
    public int getItemCount() {
        return categories.size();
    }

    public class CategoryViewHolder extends RecyclerView.ViewHolder{
        CategorySampleBinding binding;

        public CategoryViewHolder(@NonNull View itemView) {

            super(itemView);
            binding = CategorySampleBinding.bind(itemView);
        }
    }
}

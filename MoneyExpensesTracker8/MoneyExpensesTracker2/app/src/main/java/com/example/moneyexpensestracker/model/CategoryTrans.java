package com.example.moneyexpensestracker.model;

public class CategoryTrans {
    private String categoryName;

    public String getCategoryName() {
        return categoryName;
    }

    public void setCategoryName(String categoryName) {
        this.categoryName = categoryName;
    }

    public CategoryTrans(){}
    public CategoryTrans(String categoryName) {
        this.categoryName = categoryName;
    }
}

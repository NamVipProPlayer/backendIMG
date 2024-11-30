package com.example.moneyexpensestracker.model;

import java.util.Date;

public class TransList {
    private String type, category,notes;
    private Date date;
    private  double amount;

    private long id;

    public TransList() {
    }

    public TransList(String type, String category, String notes, Date date, double amount, long id) {
        this.type = type;
        this.category = category;
        this.notes = notes;
        this.date = date;
        this.amount = amount;
        this.id = id;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public Date getDate() {
        return date;
    }

    public void setDate(Date date) {
        this.date = date;
    }

    public double getAmount() {
        return amount;
    }

    public void setAmount(double amount) {
        this.amount = amount;
    }

    public long getId() {
        return id;
    }

    public void setId(long id) {
        this.id = id;
    }
}

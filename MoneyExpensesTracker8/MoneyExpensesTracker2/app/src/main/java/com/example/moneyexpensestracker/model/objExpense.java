package com.example.moneyexpensestracker.model;

public class objExpense {
    private int id;
    private int amount;
    private String date;
    private String type; // Added for expense type
    private String category;
    private String note; // Added for additional notes

    public objExpense() {}

    public objExpense(int id, int amount, String date, String type, String category, String note) {
        this.id = id;
        this.amount = amount;
        this.date = date;
        this.type = type;
        this.category = category;
        this.note = note;
    }

    // Getter and Setter for ID
    public int getId() {
        return id;
    }

    public void setId(int id) {
        this.id = id;
    }

    // Getter and Setter for Amount
    public int getAmount() {
        return amount;
    }

    public void setAmount(int amount) {
        this.amount = amount;
    }

    // Getter and Setter for Date
    public String getDate() {
        return date;
    }

    public void setDate(String date) {
        this.date = date;
    }

    // Getter and Setter for Type
    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    // Getter and Setter for Category
    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    // Getter and Setter for Note
    public String getNote() {
        return note;
    }

    public void setNote(String note) {
        this.note = note;
    }
}

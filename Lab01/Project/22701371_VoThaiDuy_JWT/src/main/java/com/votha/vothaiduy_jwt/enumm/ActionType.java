package com.votha.vothaiduy_jwt.enumm;

import lombok.Getter;

@Getter
public enum ActionType {
    CREATE("Create"),
    BOOK_TOUR("Book Tour"),
    UPDATE("Update"),
    DELETE("Delete"),
    VIEW("View"),
    CHANGE("Change Tour"),
    CANCEL("Cancel Tour");

    private final String message;

    ActionType(String message) {
        this.message = message;
    }
}

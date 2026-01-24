package com.votha.vothaiduy_jwt.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;

@Getter
public enum ErrorCode {
    UNCATEGORIZED_EXCEPTION(9999, "Uncategorized error", HttpStatus.INTERNAL_SERVER_ERROR),
    INVALID_KEY(1001, "Uncategorized error", HttpStatus.BAD_REQUEST),
    USER_EXISTED(1002, "User existed", HttpStatus.BAD_REQUEST),
    USERNAME_INVALID(1003, "Username must be at least {min} characters", HttpStatus.BAD_REQUEST),
    INVALID_PASSWORD(1004, "Password must be at least {min} characters", HttpStatus.BAD_REQUEST),
    USER_NOT_EXISTED(1005, "User not existed", HttpStatus.NOT_FOUND),
    UNAUTHENTICATED(1006, "Unauthenticated", HttpStatus.UNAUTHORIZED),
    UNAUTHORIZED(1007, "You do not have permission", HttpStatus.FORBIDDEN),
    INVALID_DOB(1008, "Your age must be at least {min}", HttpStatus.BAD_REQUEST),
    INVALID_CREDENTIALS(1009, "Invalid credentials, please try again", HttpStatus.BAD_REQUEST),
    PASSWORD_EXISTED(1010, "Password existed", HttpStatus.BAD_REQUEST),
    INVALID_SERIALIZED_TOKEN(1011, "Invalid serialized unsecured/JWS/JWE", HttpStatus.BAD_REQUEST),
    USER_INACTIVE(1032, "User not available", HttpStatus.BAD_REQUEST),
    OTP_INVALID(1033, "OTP is invalid", HttpStatus.BAD_REQUEST),
    OTP_EXPIRED(1034, "OTP is expired", HttpStatus.BAD_REQUEST),
    TOKEN_RESET_INVALID(1035, "Reset token is invalid", HttpStatus.BAD_REQUEST),
    TOKEN_RESET_EXPIRED(1036, "Reset token is expired", HttpStatus.BAD_REQUEST),
    EMAIL_EXISTED(1037, "Email already existed", HttpStatus.BAD_REQUEST),
    PASSWORD_INCORRECT(1038, "Old password is incorrect", HttpStatus.BAD_REQUEST);

    //code 200 - OK


    ErrorCode(int code, String message, HttpStatusCode statusCode) {
        this.code = code;
        this.message = message;
        this.statusCode = statusCode;
    }

    private final int code;
    private final String message;
    private final HttpStatusCode statusCode;
}

package com.votha.vothaiduy_jwt.exception;

import java.util.Map;

import com.votha.vothaiduy_jwt.dto.response.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.AuthenticationServiceException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

import lombok.extern.slf4j.Slf4j;


@ControllerAdvice
@Slf4j
public class GlobalHandlerException {
    private static final String MIN_ATTRIBUTE = "min";

    // Bad request
    @ExceptionHandler(value = Exception.class)
    ResponseEntity<ApiResponse> handlingRunTimeException(RuntimeException exception) {
        log.error("Exception: ", exception);

        ApiResponse<?> apiResponse = ApiResponse.builder()
                .code(ErrorCode.UNCATEGORIZED_EXCEPTION.getCode())
                .message(ErrorCode.UNCATEGORIZED_EXCEPTION.getMessage())
                .result(null)
                .build();

        return ResponseEntity.badRequest().body(apiResponse);
    }

    // Xu ly custom exception
    @ExceptionHandler(value = AppException.class)
    ResponseEntity<ApiResponse<?>> handlingAppException(AppException exception) {
        ErrorCode errorCode = exception.getErrorCode();
        log.error(
                "AppException: code={}, message={}, exception={}",
                errorCode.getCode(),
                errorCode.getMessage(),
                exception.getMessage(),
                exception);

        ApiResponse<?> apiResponse = ApiResponse.builder()
                .code(errorCode.getCode())
                .message(errorCode.getMessage())
                .result(null)
                .build();

        return ResponseEntity.status(errorCode.getStatusCode()).body(apiResponse);
    }

    @ExceptionHandler(value = AccessDeniedException.class)
    ResponseEntity<ApiResponse<?>> handlingAccessDeniedException(AccessDeniedException exception) {
        ErrorCode errorCode = ErrorCode.UNAUTHORIZED;

        return ResponseEntity.status(errorCode.getStatusCode())
                .body(ApiResponse.builder()
                        .code(errorCode.getCode())
                        .message(errorCode.getMessage())
                        .result(null)
                        .build());
    }

    @ExceptionHandler(value = AuthenticationServiceException.class)
    ResponseEntity<ApiResponse<?>> handlingAuthenticationServiceException(AuthenticationServiceException exception) {
        ErrorCode errorCode = ErrorCode.INVALID_SERIALIZED_TOKEN;

        return ResponseEntity.status(errorCode.getStatusCode())
                .body(ApiResponse.builder()
                        .code(errorCode.getCode())
                        .message(errorCode.getMessage())
                        .result(null)
                        .build());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    ResponseEntity<ApiResponse<?>> handleValidationExceptions(MethodArgumentNotValidException ex) {
        // Lấy tất cả các field errors
        var fieldErrors = ex.getBindingResult().getFieldErrors();

        // Tạo error message từ tất cả các errors
        String errorMessage = fieldErrors.stream()
                .map(err -> {
                    String field = err.getField();
                    String message = err.getDefaultMessage();
                    Object rejectedValue = err.getRejectedValue();
                    return String.format("%s: %s (rejected value: %s)", field, message, rejectedValue);
                })
                .reduce((first, second) -> first + "; " + second)
                .orElse("Invalid request");

        // Log chi tiết
        log.error("Validation error - {} field(s) failed: {}", fieldErrors.size(), errorMessage);
        fieldErrors.forEach(err -> log.error(
                "  Field '{}': rejected value '{}', message: '{}'",
                err.getField(),
                err.getRejectedValue(),
                err.getDefaultMessage()));

        // Trả về error message từ field đầu tiên (để đơn giản)
        String firstErrorMessage = fieldErrors.stream()
                .findFirst()
                .map(err -> err.getDefaultMessage())
                .orElse("Invalid request");

        ApiResponse<?> apiResponse = ApiResponse.builder()
                .code(ErrorCode.INVALID_KEY.getCode())
                .message(firstErrorMessage)
                .result(null)
                .build();

        return ResponseEntity.badRequest().body(apiResponse);
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    ResponseEntity<ApiResponse<?>> handleHttpMessageNotReadableException(HttpMessageNotReadableException ex) {
        log.error("Invalid request body: ", ex);

        ApiResponse<?> apiResponse = ApiResponse.builder()
                .code(ErrorCode.INVALID_KEY.getCode())
                .message("Invalid request body format. Please check your request.")
                .result(null)
                .build();

        return ResponseEntity.badRequest().body(apiResponse);
    }

    private String mapAttribute(String message, Map<String, Object> attributes) {
        String minValue = String.valueOf(attributes.get(MIN_ATTRIBUTE));

        return message.replace("{" + MIN_ATTRIBUTE + "}", minValue);
    }
}

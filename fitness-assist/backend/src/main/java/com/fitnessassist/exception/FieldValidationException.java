package com.fitnessassist.exception;

import lombok.Getter;

import java.util.Map;

/** Validation failure on specific fields, reported as 400 with a field-to-message map. */
@Getter
public class FieldValidationException extends RuntimeException {

    private final Map<String, String> fieldErrors;

    public FieldValidationException(Map<String, String> fieldErrors) {
        super("Validation failed");
        this.fieldErrors = fieldErrors;
    }
}

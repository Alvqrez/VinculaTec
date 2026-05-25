import React, { useState, useEffect } from "react";
import { View, TextInput, Text, StyleSheet } from "react-native";
import PropTypes from "prop-types";
import { useTheme } from "../context/ThemeContext";

/**
 * Input con validación visual en tiempo real
 * Mantenedor de consistencia con el diseño existente
 */
export function ValidatedInput({
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  keyboardType = "default",
  autoCapitalize = "sentences",
  validator,
  errorMessage,
  required = false,
  style,
  ...props
}) {
  const { colors: C } = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const [isValid, setIsValid] = useState(null); // null, true, false
  const [validationMessage, setValidationMessage] = useState("");

  // Validación en tiempo real
  useEffect(() => {
    if (validator && value && value.length > 0) {
      const result = validator(value);
      setIsValid(result.isValid);
      setValidationMessage(result.message || "");
    } else if (required && value && value.length > 0) {
      setIsValid(true);
      setValidationMessage("");
    } else if (!value) {
      setIsValid(null);
      setValidationMessage("");
    }
  }, [value, validator, required]);

  const handleFocus = () => setIsFocused(true);
  const handleBlur = () => setIsFocused(false);

  const getBorderColor = () => {
    if (isValid === false) return C.red;
    if (isValid === true) return C.green;
    if (isFocused) return C.primary;
    return C.border;
  };

  const getBackgroundColor = () => {
    if (isValid === false) return C.redLight;
    return C.white;
  };

  return (
    <View style={[styles.container, style]}>
      <TextInput
        style={[
          styles.input,
          {
            borderColor: getBorderColor(),
            backgroundColor: getBackgroundColor(),
            color: C.text,
          },
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={C.textMuted}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        onFocus={handleFocus}
        onBlur={handleBlur}
        {...props}
      />
      
      {/* Mensaje de validación */}
      {(validationMessage || errorMessage) && (
        <Text style={[
          styles.validationMessage,
          { 
            color: isValid === false ? C.red : C.textMuted 
          }
        ]}>
          {validationMessage || errorMessage}
        </Text>
      )}
    </View>
  );
}

// Validadores comunes
export const validators = {
  required: (value) => ({
    isValid: value && value.trim().length > 0,
    message: "Este campo es requerido"
  }),

  email: (value) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return {
      isValid: emailRegex.test(value),
      message: "Formato de email inválido"
    };
  },

  minLength: (min) => (value) => ({
    isValid: value.length >= min,
    message: `Mínimo ${min} caracteres`
  }),

  maxLength: (max) => (value) => ({
    isValid: value.length <= max,
    message: `Máximo ${max} caracteres`
  }),

  feedback: (value) => ({
    isValid: value && value.trim().length >= 10,
    message: "El feedback debe tener al menos 10 caracteres"
  })
};

// Definición de PropTypes para validación
ValidatedInput.propTypes = {
  value: PropTypes.string.isRequired,
  onChangeText: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  secureTextEntry: PropTypes.bool,
  keyboardType: PropTypes.string,
  autoCapitalize: PropTypes.string,
  validator: PropTypes.func,
  errorMessage: PropTypes.string,
  required: PropTypes.bool,
  style: PropTypes.object,
};

ValidatedInput.defaultProps = {
  placeholder: "",
  secureTextEntry: false,
  keyboardType: "default",
  autoCapitalize: "sentences",
  validator: null,
  errorMessage: "",
  required: false,
  style: {},
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  input: {
    height: 44,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 14,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 1.41,
  },
  validationMessage: {
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
});

// Form validation utilities

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

// Email validation
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
};

// Password validation
export const validatePassword = (password: string): ValidationResult => {
  const errors: ValidationError[] = [];
  
  if (password.length < 6) {
    errors.push({ field: 'password', message: 'Password must be at least 6 characters long' });
  }
  
  if (!/(?=.*[a-z])/.test(password)) {
    errors.push({ field: 'password', message: 'Password must contain at least one lowercase letter' });
  }
  
  if (!/(?=.*[A-Z])/.test(password)) {
    errors.push({ field: 'password', message: 'Password must contain at least one uppercase letter' });
  }
  
  if (!/(?=.*\d)/.test(password)) {
    errors.push({ field: 'password', message: 'Password must contain at least one number' });
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Phone number validation
export const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
};

// Required field validation
export const validateRequired = (value: string, fieldName: string): ValidationError | null => {
  if (!value.trim()) {
    return { field: fieldName, message: `${fieldName} is required` };
  }
  return null;
};

// URL validation
export const validateUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// Generic form validator
export const validateForm = (
  formData: Record<string, any>,
  rules: Record<string, (value: any) => ValidationError | ValidationError[] | null>
): ValidationResult => {
  const errors: ValidationError[] = [];
  
  Object.entries(rules).forEach(([field, validator]) => {
    const result = validator(formData[field]);
    if (result) {
      if (Array.isArray(result)) {
        errors.push(...result);
      } else {
        errors.push(result);
      }
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Common validation rules
export const commonRules = {
  email: (value: string) => {
    const required = validateRequired(value, 'Email');
    if (required) return required;
    
    if (!validateEmail(value)) {
      return { field: 'email', message: 'Please enter a valid email address' };
    }
    return null;
  },
  
  password: (value: string) => {
    const required = validateRequired(value, 'Password');
    if (required) return required;
    
    const validation = validatePassword(value);
    return validation.errors;
  },
  
  phone: (value: string) => {
    if (!value.trim()) return null; // Optional field
    
    if (!validatePhone(value)) {
      return { field: 'phone', message: 'Please enter a valid phone number' };
    }
    return null;
  },
  
  firstName: (value: string) => validateRequired(value, 'First name'),
  lastName: (value: string) => validateRequired(value, 'Last name'),
  name: (value: string) => validateRequired(value, 'Name'),
  title: (value: string) => validateRequired(value, 'Title'),
};
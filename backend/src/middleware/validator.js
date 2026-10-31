export const validatePassword = (password) => {
  if (!password || typeof password !== 'string') {
    return { valid: false, message: 'Password is required' };
  }
  // Must be > 8 characters, with uppercase, lowercase, and special character
  if (password.length <= 8) {
    return { valid: false, message: 'Password must be more than 8 characters long.' };
  }
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

  if (!hasUpperCase) {
    return { valid: false, message: 'Password must contain at least one uppercase letter.' };
  }
  if (!hasLowerCase) {
    return { valid: false, message: 'Password must contain at least one lowercase letter.' };
  }
  if (!hasSpecial) {
    return { valid: false, message: 'Password must contain at least one special character (!@#$%^&* etc.).' };
  }

  return { valid: true };
};

export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).toLowerCase());
};

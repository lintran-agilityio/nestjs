export const REGEX = {
  /**
   * Password format validation
   * Must contain at least one uppercase letter, one lowercase letter, and one special character
   */
  PASSWORD:
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*()_+\-=\\[\]{};':"\\|,.<>\\/?]).+$/,

  // Email format validation
  EMAIL: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,

  // UUID any version (v1-v5) validation
  UUID_ANY:
    /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/,
};

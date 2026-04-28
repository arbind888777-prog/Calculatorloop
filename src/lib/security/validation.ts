import { z } from 'zod';

/**
 * Validation schemas for forms and user inputs
 */

// User registration schema
export const registrationSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters')
    .regex(
      /^[\p{L}\p{M}][\p{L}\p{M}\s.'-]*$/u,
      'Name can only contain letters, spaces, apostrophes, periods, and hyphens'
    ),
  email: z
    .string()
    .trim()
    .email('Invalid email address')
    .min(5, 'Email must be at least 5 characters')
    .max(255, 'Email must be less than 255 characters')
    .toLowerCase(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must be less than 128 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/,
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    ),
});

// Login schema
export const loginSchema = z.object({
  email: z.string().email('Invalid email address').toLowerCase(),
  password: z.string().min(1, 'Password is required'),
});

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .trim()
    .email('Invalid email address')
    .max(255, 'Email must be less than 255 characters')
    .toLowerCase(),
  turnstileToken: z.string().trim().max(2048).optional(),
});

export const resetPasswordSchema = z.object({
  email: z
    .string()
    .trim()
    .email('Invalid email address')
    .max(255, 'Email must be less than 255 characters')
    .toLowerCase(),
  token: z
    .string()
    .trim()
    .min(32, 'Invalid reset token')
    .max(255, 'Invalid reset token'),
  password: registrationSchema.shape.password,
});

export const accountRecoverySchema = z.object({
  accountType: z.enum(['user', 'admin']).default('user'),
  name: z
    .string()
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters')
    .regex(
      /^[\p{L}\p{M}][\p{L}\p{M}\s.'-]*$/u,
      'Name can only contain letters, spaces, apostrophes, periods, and hyphens'
    ),
  contactEmail: z
    .string()
    .trim()
    .email('Invalid contact email address')
    .max(255, 'Contact email must be less than 255 characters')
    .toLowerCase(),
  loginHint: z
    .string()
    .trim()
    .max(255, 'Login hint must be less than 255 characters')
    .optional()
    .or(z.literal('')),
  phone: z
    .string()
    .trim()
    .max(30, 'Phone number must be less than 30 characters')
    .regex(/^[\d+\-() ]*$/, 'Phone can only contain numbers, spaces, +, -, and parentheses')
    .optional()
    .or(z.literal('')),
  message: z
    .string()
    .trim()
    .min(10, 'Please share a little more detail')
    .max(1000, 'Message must be less than 1000 characters'),
  turnstileToken: z.string().trim().max(2048).optional(),
});

// Contact form schema
export const contactSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters')
    .regex(/^[a-zA-Z\s]+$/, 'Name can only contain letters and spaces'),
  email: z.string().email('Invalid email address').toLowerCase(),
  subject: z
    .string()
    .min(5, 'Subject must be at least 5 characters')
    .max(200, 'Subject must be less than 200 characters'),
  message: z
    .string()
    .min(10, 'Message must be at least 10 characters')
    .max(2000, 'Message must be less than 2000 characters'),
});

// Newsletter subscription schema
export const newsletterSchema = z.object({
  email: z.string().email('Invalid email address').toLowerCase(),
});

// API key creation schema
export const apiKeySchema = z.object({
  name: z
    .string()
    .min(3, 'Name must be at least 3 characters')
    .max(50, 'Name must be less than 50 characters')
    .regex(/^[a-zA-Z0-9\s-_]+$/, 'Name can only contain letters, numbers, spaces, hyphens, and underscores'),
  tier: z.enum(['FREE', 'BASIC', 'PRO', 'ENTERPRISE']).optional(),
  expiresInDays: z.number().min(1).max(365).optional(),
});

// Calculator input validation
export const emiCalculatorSchema = z.object({
  principal: z
    .number()
    .min(1000, 'Principal must be at least ₹1,000')
    .max(100000000, 'Principal must be less than ₹10 crore'),
  interestRate: z
    .number()
    .min(0.1, 'Interest rate must be at least 0.1%')
    .max(50, 'Interest rate must be less than 50%'),
  tenure: z
    .number()
    .min(1, 'Tenure must be at least 1 year')
    .max(30, 'Tenure must be less than 30 years'),
  includeSchedule: z.boolean().optional(),
});

export const bmiCalculatorSchema = z.object({
  weight: z
    .number()
    .min(1, 'Weight must be greater than 0')
    .max(500, 'Weight must be less than 500'),
  height: z
    .number()
    .min(1, 'Height must be greater than 0')
    .max(300, 'Height must be less than 300'),
  unit: z.enum(['metric', 'imperial']).optional(),
  age: z.number().min(1).max(150).optional(),
  gender: z.enum(['male', 'female']).optional(),
});

/**
 * Sanitize string input to prevent XSS
 */
export function sanitizeString(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove < and >
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim();
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  return z.string().email().safeParse(email).success;
}

/**
 * Validate URL format
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Check for SQL injection patterns
 */
export function containsSqlInjection(input: string): boolean {
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)/gi,
    /('|--|;|\/\*|\*\/)/g,
    /(UNION|OR|AND)\s+\d+\s*=\s*\d+/gi,
  ];

  return sqlPatterns.some((pattern) => pattern.test(input));
}

/**
 * Validate and sanitize user input
 */
export function validateAndSanitize<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: string[] } {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  const errors = result.error.errors.map((err) => {
    const path = err.path.join('.');
    return `${path}: ${err.message}`;
  });

  return { success: false, errors };
}

/**
 * Rate limit configuration
 */
export const RATE_LIMITS = {
  contact: { requests: 5, window: 3600 }, // 5 requests per hour
  register: { requests: 3, window: 3600 }, // 3 requests per hour
  login: { requests: 10, window: 3600 }, // 10 requests per hour
  newsletter: { requests: 2, window: 3600 }, // 2 requests per hour
};

/**
 * Check if password is strong
 */
export function isStrongPassword(password: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (!/[@$!%*?&]/.test(password)) {
    errors.push('Password must contain at least one special character (@$!%*?&)');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

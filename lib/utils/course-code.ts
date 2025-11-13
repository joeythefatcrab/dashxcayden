/**
 * Generate a random course code (e.g., "ABC-123", "XYZ-789")
 */
export function generateCourseCode(): string {
  const letters = "ABCDEFGHJKLMNPQRSTUVWXYZ"; // Exclude I and O to avoid confusion
  const numbers = "0123456789";

  let code = "";

  // Generate 3 letters
  for (let i = 0; i < 3; i++) {
    code += letters.charAt(Math.floor(Math.random() * letters.length));
  }

  code += "-";

  // Generate 3 numbers
  for (let i = 0; i < 3; i++) {
    code += numbers.charAt(Math.floor(Math.random() * numbers.length));
  }

  return code;
}

/**
 * Validate course code format
 */
export function isValidCourseCode(code: string): boolean {
  const pattern = /^[A-Z]{3}-[0-9]{3}$/;
  return pattern.test(code.toUpperCase());
}

/**
 * Format course code to uppercase with dash
 */
export function formatCourseCode(code: string): string {
  return code.toUpperCase().trim();
}

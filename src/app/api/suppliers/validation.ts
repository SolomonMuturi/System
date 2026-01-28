// app/api/suppliers/validation.ts
export interface SupplierValidationResult {
  isValid: boolean;
  errors: string[];
  field?: 'name' | 'phone' | 'code' | 'email';
  message?: string;
}

export async function validateSupplierData(
  data: any,
  excludeId?: string
): Promise<SupplierValidationResult> {
  const errors: string[] = [];

  // Required fields validation
  if (!data.name?.trim()) errors.push('Supplier name is required');
  if (!data.contact_phone?.trim()) errors.push('Phone number is required');
  if (!data.supplier_code?.trim()) errors.push('Supplier code is required');

  // Name validation
  if (data.name) {
    const nameRegex = /^[a-zA-Z0-9\s&.-]{2,100}$/;
    if (!nameRegex.test(data.name.trim())) {
      errors.push('Supplier name must be 2-100 characters and can only contain letters, numbers, spaces, &, ., and -');
    }
  }

  // Phone validation
  if (data.contact_phone) {
    const phoneRegex = /^\+?[\d\s\-\(\)]{10,20}$/;
    const cleanPhone = data.contact_phone.replace(/\s/g, '');
    if (!phoneRegex.test(cleanPhone)) {
      errors.push('Phone number must be 10-20 digits');
    }
    if (cleanPhone.length < 10) {
      errors.push('Phone number must be at least 10 digits');
    }
  }

  // Email validation
  if (data.contact_email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.contact_email.trim())) {
      errors.push('Invalid email format');
    }
  }

  // Payment details validation
  if (data.mpesa_paybill && !data.mpesa_account_number) {
    errors.push('M-PESA account number is required when paybill is provided');
  }
  if (data.mpesa_account_number && !data.mpesa_paybill) {
    errors.push('M-PESA paybill is required when account number is provided');
  }
  
  if (data.bank_name && !data.bank_account_number) {
    errors.push('Bank account number is required when bank name is provided');
  }
  if (data.bank_account_number && !data.bank_name) {
    errors.push('Bank name is required when bank account number is provided');
  }

  // KRA PIN validation (if provided)
  if (data.kra_pin) {
    const kraPinRegex = /^[A-Z]{1}\d{9}[A-Z]{1}$/;
    if (!kraPinRegex.test(data.kra_pin.trim())) {
      errors.push('Invalid KRA PIN format. Should be like A123456789B');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

export function formatPhoneNumber(phone: string): string {
  // Remove all non-digit characters except leading +
  const cleaned = phone.replace(/[^\d+]/g, '');
  
  // Ensure it starts with country code if not already
  if (cleaned.startsWith('+')) {
    return cleaned;
  }
  
  // If it starts with 0, replace with +254
  if (cleaned.startsWith('0')) {
    return '+254' + cleaned.slice(1);
  }
  
  // If it's 9 digits, assume it's a Kenyan number without country code
  if (cleaned.length === 9) {
    return '+254' + cleaned;
  }
  
  // If it's 10 digits and starts with 07, convert to +2547
  if (cleaned.length === 10 && cleaned.startsWith('07')) {
    return '+254' + cleaned.slice(1);
  }
  
  // Return as-is with + if it doesn't have it
  return cleaned.startsWith('+') ? cleaned : '+' + cleaned;
}
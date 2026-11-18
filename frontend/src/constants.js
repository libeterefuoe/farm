// Mirrors backend constants so the UI can render ENUMs
// consistently with the database.
export const PROVINCES = [
  'Gauteng',
  'Free State',
  'KwaZulu-Natal',
  'Western Cape',
  'Eastern Cape',
  'Limpopo',
  'Mpumalanga',
  'North West'
];

export const PACKAGING_SIZES = ['SMALL', 'MEDIUM', 'LARGE'];

export const FRUIT_STATUSES = ['ACTIVE', 'INACTIVE'];

export const PAYMENT_METHODS = [
  { value: 'CASH',         label: 'Cash' },
  { value: 'MOBILE_MONEY', label: 'Mobile Money' },
  { value: 'CREDIT',       label: 'Credit' }
];

export const PAYMENT_STATUSES = ['PAID', 'PARTIALLY_PAID', 'UNPAID'];
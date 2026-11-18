// Shared constants used across models/controllers.
// Keeping these in one place makes ENUM checks consistent
// with the database.

module.exports = {
  PACKAGING_SIZES: ['SMALL', 'MEDIUM', 'LARGE'],
  FRUIT_STATUSES: ['ACTIVE', 'INACTIVE'],
  PAYMENT_STATUSES: ['PAID', 'PARTIALLY_PAID', 'UNPAID'],
  PAYMENT_METHODS: ['CASH', 'MOBILE_MONEY', 'CREDIT'],
  PROVINCES: [
    'Gauteng',
    'Free State',
    'KwaZulu-Natal',
    'Western Cape',
    'Eastern Cape',
    'Limpopo',
    'Mpumalanga',
    'North West'
  ]
};
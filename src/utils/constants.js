export const USER_ROLES = [
  { value: 'Admin', label: 'Administrator' },
  { value: 'Manager', label: 'Manager' },
  { value: 'Support', label: 'Support Staff' },
  { value: 'MTN_Staff', label: 'MTN Staff' },
  { value: 'Viewer', label: 'Viewer' },
];

export const USER_TYPES = [
  { value: 'Advocate', label: 'Advocate' },
  { value: 'Magistrate', label: 'Magistrate' },
  { value: 'Judge', label: 'Judge' },
  { value: 'Clerk', label: 'Clerk' },
  { value: 'Other', label: 'Other' },
];

export const REGIONS = [
  { value: 'GP', label: 'Gauteng' },
  { value: 'WC', label: 'Western Cape' },
  { value: 'KZN', label: 'KwaZulu-Natal' },
  { value: 'EC', label: 'Eastern Cape' },
  { value: 'FS', label: 'Free State' },
  { value: 'MP', label: 'Mpumalanga' },
  { value: 'NW', label: 'North West' },
  { value: 'LP', label: 'Limpopo' },
  { value: 'NC', label: 'Northern Cape' },
];

export const NETWORK_PROVIDERS = [
  { value: 'MTN', label: 'MTN' },
  { value: 'Vodacom', label: 'Vodacom' },
  { value: 'Telkom', label: 'Telkom' },
  { value: 'Cell_C', label: 'Cell C' },
];

export const REGISTRATION_STATUS = [
  { value: 'Pending', label: 'Pending', color: 'warning' },
  { value: 'Verified', label: 'Verified', color: 'success' },
  { value: 'Rejected', label: 'Rejected', color: 'error' },
  { value: 'Suspended', label: 'Suspended', color: 'default' },
];

export const TITLES = [
  { value: 'Mr', label: 'Mr' },
  { value: 'Mrs', label: 'Mrs' },
  { value: 'Ms', label: 'Ms' },
  { value: 'Dr', label: 'Dr' },
  { value: 'Prof', label: 'Prof' },
  { value: 'Adv', label: 'Adv' },
  { value: 'Hon', label: 'Hon' },
];

export const CONTRACT_DURATIONS = [
  { value: 12, label: '12 months' },
  { value: 24, label: '24 months' },
  { value: 36, label: '36 months' },
];

export const API_ENDPOINTS = {
  ADMIN: {
    DASHBOARD: '/admin/dashboard',
    ALL_USERS: '/admin/all-users',
    CLIENT_USERS: '/admin/client-users',
    OPERATIONAL_USERS: '/admin/operational-users',
    STATISTICS: '/admin/statistics',
    SEARCH: '/admin/search',
    UPDATE_STATUS: '/admin/client-users/:id/status',
  },
};

export const LOCAL_STORAGE_KEYS = {
  AUTH_TOKEN: 'admin_token',
  USER_DATA: 'admin_user',
  THEME: 'admin_theme',
  LANGUAGE: 'admin_language',
};

export const DATE_FORMATS = {
  DISPLAY: 'DD MMM YYYY',
  DISPLAY_WITH_TIME: 'DD MMM YYYY HH:mm',
  API: 'YYYY-MM-DD',
  API_WITH_TIME: 'YYYY-MM-DDTHH:mm:ss',
};

export const TABLE_CONFIG = {
  PAGE_SIZE_OPTIONS: [5, 10, 25, 50, 100],
  DEFAULT_PAGE_SIZE: 10,
  DEFAULT_SORT_FIELD: 'created_at',
  DEFAULT_SORT_ORDER: 'desc',
};

export const VALIDATION_RULES = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^(\+27|0)[1-9][0-9]{8}$/,
  PERSAL_ID: /^[0-9]{8,13}$/,
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
};

export const ERROR_MESSAGES = {
  NETWORK: 'Network error. Please check your connection.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  FORBIDDEN: 'Access forbidden. Please contact administrator.',
  NOT_FOUND: 'The requested resource was not found.',
  SERVER_ERROR: 'Internal server error. Please try again later.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  TIMEOUT: 'Request timeout. Please try again.',
  DEFAULT: 'An unexpected error occurred. Please try again.',
};

export const SUCCESS_MESSAGES = {
  USER_UPDATED: 'User updated successfully',
  STATUS_UPDATED: 'Status updated successfully',
  USER_CREATED: 'User created successfully',
  USER_DELETED: 'User deleted successfully',
  DATA_LOADED: 'Data loaded successfully',
  OPERATION_SUCCESS: 'Operation completed successfully',
};

export const STATUS_COLORS = {
  Verified: '#4caf50',
  Pending: '#ff9800',
  Rejected: '#f44336',
  Suspended: '#757575',
  Active: '#4caf50',
  Inactive: '#757575',
  Expired: '#f44336',
};

export const STATUS_ICONS = {
  Verified: 'CheckCircle',
  Pending: 'Pending',
  Rejected: 'Cancel',
  Active: 'CheckCircle',
  Inactive: 'RemoveCircle',
  Expired: 'Error',
};

// export default {
//   USER_ROLES,
//   USER_TYPES,
//   REGIONS,
//   NETWORK_PROVIDERS,
//   REGISTRATION_STATUS,
//   TITLES,
//   CONTRACT_DURATIONS,
//   API_ENDPOINTS,
//   LOCAL_STORAGE_KEYS,
//   DATE_FORMATS,
//   TABLE_CONFIG,
//   VALIDATION_RULES,
//   ERROR_MESSAGES,
//   SUCCESS_MESSAGES,
//   STATUS_COLORS,
//   STATUS_ICONS,
// };
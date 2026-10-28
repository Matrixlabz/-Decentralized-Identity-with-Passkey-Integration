export const STELLAR_NETWORKS = {
  MAINNET: 'https://horizon.stellar.org',
  TESTNET: 'https://horizon-testnet.stellar.org',
  STANDALONE: 'http://localhost:8000',
} as const;

export const STELLAR_CONTRACT_IDS = {
  IDENTITY_REGISTRY: {
    MAINNET: '',
    TESTNET: '',
    STANDALONE: '',
  },
  ATTRIBUTE_VERIFICATION: {
    MAINNET: '',
    TESTNET: '',
    STANDALONE: '',
  },
  SELECTIVE_DISCLOSURE: {
    MAINNET: '',
    TESTNET: '',
    STANDALONE: '',
  },
} as const;

export const PASSKEY_CONFIG = {
  CHALLENGE_LENGTH: 32,
  USER_ID_LENGTH: 64,
  TIMEOUT: 60000, // 60 seconds
  ALLOWED_ALGORITHMS: [-7, -35], // ES256 and Ed25519
} as const;

export const ATTRIBUTE_TYPES = {
  EMAIL: {
    name: 'Email',
    icon: 'mail',
    required: false,
    verificationRequired: true,
  },
  PHONE: {
    name: 'Phone',
    icon: 'phone',
    required: false,
    verificationRequired: true,
  },
  NAME: {
    name: 'Full Name',
    icon: 'user',
    required: true,
    verificationRequired: false,
  },
  DATE_OF_BIRTH: {
    name: 'Date of Birth',
    icon: 'calendar',
    required: false,
    verificationRequired: true,
  },
  ADDRESS: {
    name: 'Address',
    icon: 'home',
    required: false,
    verificationRequired: false,
  },
  GOVERNMENT_ID: {
    name: 'Government ID',
    icon: 'shield',
    required: false,
    verificationRequired: true,
  },
  EDUCATION: {
    name: 'Education',
    icon: 'graduation-cap',
    required: false,
    verificationRequired: true,
  },
  EMPLOYMENT: {
    name: 'Employment',
    icon: 'briefcase',
    required: false,
    verificationRequired: true,
  },
  CUSTOM: {
    name: 'Custom',
    icon: 'settings',
    required: false,
    verificationRequired: false,
  },
} as const;

export const VERIFICATION_METHODS = {
  PASSKEY: {
    name: 'Passkey',
    description: 'Biometric authentication using device passkey',
    icon: 'fingerprint',
    securityLevel: 'high',
  },
  DOCUMENT: {
    name: 'Document',
    description: 'Upload and verify official documents',
    icon: 'file-text',
    securityLevel: 'medium',
  },
  BIOMETRIC: {
    name: 'Biometric',
    description: 'Advanced biometric verification',
    icon: 'eye',
    securityLevel: 'high',
  },
  THIRD_PARTY: {
    name: 'Third Party',
    description: 'Verification through trusted third parties',
    icon: 'users',
    securityLevel: 'medium',
  },
  ZERO_KNOWLEDGE: {
    name: 'Zero Knowledge',
    description: 'Privacy-preserving verification',
    icon: 'lock',
    securityLevel: 'very-high',
  },
} as const;

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/auth/login',
    LOGOUT: '/api/auth/logout',
    REGISTER: '/api/auth/register',
    REFRESH: '/api/auth/refresh',
  },
  IDENTITY: {
    CREATE: '/api/identity/create',
    GET: '/api/identity/:id',
    UPDATE: '/api/identity/:id',
    DELETE: '/api/identity/:id',
    ATTRIBUTES: '/api/identity/:id/attributes',
    VERIFICATIONS: '/api/identity/:id/verifications',
  },
  PASSKEY: {
    CREATE: '/api/passkey/create',
    AUTHENTICATE: '/api/passkey/authenticate',
    LIST: '/api/passkey/list',
    DELETE: '/api/passkey/:id',
  },
  DISCLOSURE: {
    REQUEST: '/api/disclosure/request',
    RESPOND: '/api/disclosure/respond',
    HISTORY: '/api/disclosure/history',
  },
  STELLAR: {
    BALANCE: '/api/stellar/balance',
    TRANSACTION: '/api/stellar/transaction',
    CONTRACT_CALL: '/api/stellar/contract-call',
  },
} as const;

export const ERROR_CODES = {
  // Authentication errors
  INVALID_CREDENTIALS: 'AUTH_001',
  PASSKEY_NOT_FOUND: 'AUTH_002',
  PASSKEY_CREATION_FAILED: 'AUTH_003',
  AUTHENTICATION_EXPIRED: 'AUTH_004',

  // Identity errors
  IDENTITY_NOT_FOUND: 'ID_001',
  ATTRIBUTE_NOT_FOUND: 'ID_002',
  INVALID_ATTRIBUTE_TYPE: 'ID_003',
  ATTRIBUTE_ALREADY_EXISTS: 'ID_004',

  // Verification errors
  VERIFICATION_FAILED: 'VER_001',
  VERIFICATION_EXPIRED: 'VER_002',
  INSUFFICIENT_VERIFICATION: 'VER_003',

  // Stellar errors
  TRANSACTION_FAILED: 'STELLAR_001',
  INSUFFICIENT_BALANCE: 'STELLAR_002',
  CONTRACT_EXECUTION_FAILED: 'STELLAR_003',
  NETWORK_ERROR: 'STELLAR_004',

  // General errors
  VALIDATION_ERROR: 'GEN_001',
  INTERNAL_SERVER_ERROR: 'GEN_002',
  NETWORK_TIMEOUT: 'GEN_003',
  RATE_LIMIT_EXCEEDED: 'GEN_004',
} as const;

export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_IDENTITY: 'user_identity',
  PASSKEY_CREDENTIALS: 'passkey_credentials',
  SELECTED_NETWORK: 'selected_network',
} as const;

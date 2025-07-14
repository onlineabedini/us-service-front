export interface BankValidationRule {
  name: string;
  clearingRange: [number, number];
  clearingDigits?: [number, number];
  accountDigits?: [number, number];
  structure: string;
}
export const bankValidationRules: BankValidationRule[] = [
  {
    name: 'Swedbank',
    clearingRange: [7000, 8999],
    clearingDigits: [4, 5],
    accountDigits: [7, 10], // always 10-digit account, regardless of clearing length
    structure: '4 or 5-digit clearing + 10-digit account number'
  },
  {
    name: 'Handelsbanken',
    clearingRange: [6000, 6999],
    clearingDigits: [4, 4],
    accountDigits: [7, 10],
    structure: '4-digit clearing + 9-digit account number'
  },
  {
    name: 'SEB',
    clearingRange: [5000, 5999],
    clearingDigits: [4, 4],
    accountDigits: [7, 10],
    structure: '4-digit clearing + 7-digit account number'
  },
  {
    name: 'Nordea - Personal',
    clearingRange: [3300, 3300],
    clearingDigits: [4, 4],
    accountDigits: [7, 10],
    structure: '4-digit clearing (3300) + 10-digit personal number'
  },
  {
    name: 'Nordea - Other',
    clearingRange: [3000, 3299],
    clearingDigits: [4, 4],
    accountDigits: [7, 10], // varies
    structure: '4-digit clearing + 7–10-digit account number'
  },
  {
    name: 'Länsförsäkringar Bank',
    clearingRange: [3400, 3409],
    clearingDigits: [4, 4],
    accountDigits: [7, 10],
    structure: '4-digit clearing + 9-digit account number'
  },
  {
    name: 'Danske Bank',
    clearingRange: [1200, 1399],
    clearingDigits: [4, 4],
    accountDigits: [7, 10],
    structure: '4-digit clearing + 9-digit account number'
  },
  {
    name: 'Skandiabanken',
    clearingRange: [9150, 9169],
    clearingDigits: [4, 4],
    accountDigits: [7, 10],
    structure: '4-digit clearing + 7-digit account number'
  },
  {
    name: 'ICA Banken',
    clearingRange: [9270, 9279],
    clearingDigits: [4, 4],
    accountDigits: [7, 10],
    structure: '4-digit clearing + 9-digit account number'
  },
  {
    name: 'SBAB',
    clearingRange: [9250, 9259],
    clearingDigits: [4, 4],
    accountDigits: [7, 10],
    structure: '4-digit clearing + 7-digit account number'
  },
  {
    name: 'Avanza Bank',
    clearingRange: [9550, 9569],
    clearingDigits: [4, 4],
    accountDigits: [7, 10],
    structure: '4-digit clearing + 7-digit account number'
  },
  {
    name: 'Forex Bank',
    clearingRange: [9400, 9449],
    clearingDigits: [4, 4],
    accountDigits: [7, 10],
    structure: '4-digit clearing + 9-digit account number'
  },
  {
    name: 'Resurs Bank',
    clearingRange: [9280, 9289],
    clearingDigits: [4, 4],
    accountDigits: [7, 10],
    structure: '4-digit clearing + 9-digit account number'
  },
  {
    name: 'Ikano Bank',
    clearingRange: [9170, 9179],
    clearingDigits: [4, 4],
    accountDigits: [7, 10],
    structure: '4-digit clearing + 7-digit account number'
  },
  {
    name: 'Marginalen Bank',
    clearingRange: [9230, 9239],
    clearingDigits: [4, 4],
    accountDigits: [7, 10],
    structure: '4-digit clearing + 7-digit account number'
  },
  {
    name: 'Collector Bank',
    clearingRange: [9440, 9449],
    clearingDigits: [4, 4],
    accountDigits: [7, 10],
    structure: '4-digit clearing + 9-digit account number'
  },
  {
    name: 'Klarna Bank',
    clearingRange: [9780, 9789],
    clearingDigits: [4, 4],
    accountDigits: [7, 10],
    structure: '4-digit clearing + 7–10-digit account number'
  },
  {
    name: 'Northmill Bank',
    clearingRange: [9750, 9759],
    clearingDigits: [4, 4],
    accountDigits: [7, 10],
    structure: '4-digit clearing + 7–10-digit account number'
  },
  {
    name: 'NOBA Bank Group',
    clearingRange: [9650, 9659],
    clearingDigits: [4, 4],
    accountDigits: [7, 10],
    structure: '4-digit clearing + 7–10-digit account number'
  },
  {
    name: 'Svea Bank',
    clearingRange: [9660, 9669],
    clearingDigits: [4, 4],
    accountDigits: [7, 10],
    structure: '4-digit clearing + 7–10-digit account number'
  },
  {
    name: 'TF Bank',
    clearingRange: [9670, 9679],
    clearingDigits: [4, 4],
    accountDigits: [7, 10],
    structure: '4-digit clearing + 7–10-digit account number'
  },
  {
    name: 'JAK Medlemsbank',
    clearingRange: [9680, 9689],
    clearingDigits: [4, 4],
    accountDigits: [7, 10],
    structure: '4-digit clearing + 7–10-digit account number'
  },
  {
    name: 'Ekobanken Medlemsbank',
    clearingRange: [9690, 9699],
    clearingDigits: [4, 4],
    accountDigits: [7, 10],
    structure: '4-digit clearing + 7–10-digit account number'
  },
  {
    name: 'Bluestep Bank',
    clearingRange: [9680, 9689],
    clearingDigits: [4, 4],
    accountDigits: [7, 10],
    structure: '4-digit clearing + 7-digit account number'
  },
  {
    name: 'BNP Paribas Fortis',
    clearingRange: [9470, 9479],
    clearingDigits: [4, 4],
    accountDigits: [7, 10],
    structure: '4-digit clearing + 7-digit account number'
  },
  {
    name: 'Citibank International Plc, Sweden Branch',
    clearingRange: [9040, 9049],
    clearingDigits: [4, 4],
    accountDigits: [7, 10],
    structure: '4-digit clearing + 7-digit account number'
  },
  {
    name: 'DNB Bank ASA, Branch Sweden',
    clearingRange: [9190, 9199],
    clearingDigits: [4, 4],
    accountDigits: [7, 10],
    structure: '4-digit clearing + 7-digit account number'
  },
  {
    name: 'Erik Penser Bank',
    clearingRange: [9590, 9599],
    clearingDigits: [4, 4],
    accountDigits: [7, 10],
    structure: '4-digit clearing + 7-digit account number'
  },
  {
    name: 'Landshypotek Bank',
    clearingRange: [9390, 9399],
    clearingDigits: [4, 4],
    accountDigits: [7, 10],
    structure: '4-digit clearing + 7-digit account number'
  },
  {
    name: 'Lån & Spar Bank Sverige',
    clearingRange: [9630, 9639],
    clearingDigits: [4, 4],
    accountDigits: [7, 10],
    structure: '4-digit clearing + 7-digit account number'
  },
  {
    name: 'Multitude Bank',
    clearingRange: [9070, 9079],
    clearingDigits: [4, 4],
    accountDigits: [7, 10],
    structure: '4-digit clearing + 7-digit account number'
  },
  {
    name: 'Nordax Bank AB',
    clearingRange: [9640, 9649],
    clearingDigits: [4, 4],
    accountDigits: [7, 10],
    structure: '4-digit clearing + 7-digit account number'
  },
  {
    name: 'Royal Bank of Scotland',
    clearingRange: [9090, 9099],
    clearingDigits: [4, 4],
    accountDigits: [7, 10],
    structure: '4-digit clearing + 7-digit account number'
  },
  {
    name: 'Santander Consumer Bank AS',
    clearingRange: [9460, 9469],
    clearingDigits: [4, 4],
    accountDigits: [7, 10],
    structure: '4-digit clearing + 7-digit account number'
  },
  {
    name: 'Sparbanken Syd',
    clearingRange: [9570, 9579],
    clearingDigits: [4, 4],
    accountDigits: [7, 10],
    structure: '4-digit clearing + 10-digit account number'
  },
  {
    name: 'Sparbanken Öresund',
    clearingRange: [9300, 9349],
    clearingDigits: [4, 4],
    accountDigits: [7, 10],
    structure: '4-digit clearing + 10-digit account number'
  },
  {
    name: 'Bank of Åland plc (Finland), Swedish branch',
    clearingRange: [2300, 2399],
    clearingDigits: [4, 4],
    accountDigits: [7, 10],
    structure: '4-digit clearing + 7-digit account number'
  }
];

// Function to validate clearing number
export const validateClearingNumber = (clearingNumber: string): { isValid: boolean; bank?: BankValidationRule; error?: string } => {
  const cleanedNumber = clearingNumber.replace(/[^0-9]/g, '');

  if (!cleanedNumber) {
    return { isValid: false, error: 'Clearing number is required' };
  }

  // check if clearing number is valid for any bank
  // get first 4 digits
  const clearingNum = parseInt(cleanedNumber.slice(0, 4), 10);
  const matchingBank = bankValidationRules.find(bank =>
    clearingNum >= bank.clearingRange[0] && clearingNum <= bank.clearingRange[1]
  );
  if (!matchingBank) {
    return { isValid: false, error: 'Invalid clearing number' };
  }

  // validate length
  const length = cleanedNumber.length;
  const minLength = matchingBank.clearingDigits?.[0];
  const maxLength = matchingBank.clearingDigits?.[1];

  if (minLength && maxLength && (length < minLength || length > maxLength)) {
    return { isValid: false, error: 'Invalid clearing number' };
  }

  // if all is valid, return the bank
  return { isValid: true, bank: matchingBank };
};

// __dev
// Function to validate full account
export const validateBankAccount = (clearingNumber: string, accountNumber: string): { isValid: boolean; bank?: BankValidationRule; error?: string } => {
  const cleanedClearing = clearingNumber.replace(/[^0-9]/g, '');
  const cleanedAccount = accountNumber.replace(/[^0-9]/g, '');

  // validate clearing number
  const { isValid: isValidClearing, bank: bankClearing } = validateClearingNumber(clearingNumber);

  // if clearing number is invalid, return error
  if (!isValidClearing) {
    return { isValid: false, error: 'Invalid account number' };
  }

  // validate account number
  const shortClearing = parseInt(cleanedClearing.slice(0, 4), 10);
  const bank = bankValidationRules.find(b => shortClearing >= b.clearingRange[0] && shortClearing <= b.clearingRange[1]);
  if (!bank) {
    return { isValid: false, error: 'Invalid account number' };
  }

  // validate account number length
  const length = accountNumber.length;
  const minLength = bank.accountDigits?.[0];
  const maxLength = bank.accountDigits?.[1];

  if (minLength && maxLength && (length < minLength || length > maxLength)) {
    return {
      isValid: false,
      bank,
      error: `Invalid account number`
    };
  }

  return { isValid: true, bank };
};

// Get bank name from clearing number
export const getBankName = (clearingNumber: string): string => {
  const cleaned = clearingNumber.replace(/\D/g, '').slice(0, 4);
  const num = parseInt(cleaned, 10);
  const bank = bankValidationRules.find(bank =>
    num >= bank.clearingRange[0] && num <= bank.clearingRange[1]
  );
  return bank?.name || '';
}
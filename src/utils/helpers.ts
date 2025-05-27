export function generateWithdrawalReference() {
  const prefix = "WTH";
  const timestamp = Date.now().toString();
  const randomDigits = Math.floor(Math.random() * 9000) + 1000;
  const reference = `${prefix}${timestamp}${randomDigits}`;
  return reference;
}

export function generateTransactionReference() {
  const prefix = "TRX";
  const timestamp = Date.now().toString();
  const randomDigits = Math.floor(Math.random() * 9000) + 1000;
  const reference = `${prefix}${timestamp}${randomDigits}`;
  return reference;
}
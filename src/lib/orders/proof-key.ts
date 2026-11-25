// Payment-proof object keys are `${orderNumber}[_balance].${ext}` (see /api/orders/upload-proof).
const PROOF_KEY = /^(SND-\d{8})(_balance)?\.(jpg|jpeg|png|gif|webp|pdf|heic|heif)$/i;

/** Order number a proof key belongs to, or null if the key isn't a well-formed proof key. */
export function proofKeyOrderNumber(key: string): string | null {
  const m = PROOF_KEY.exec(key.replace(/^payment-proofs\//, ""));
  return m ? m[1].toUpperCase() : null;
}

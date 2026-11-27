export const TUITION = Object.freeze({ paybill: "522533", amount: 400, days: 7, trialHours: 24 });
export function normalizePhone(input: string): string {
  const phone = input.trim().replace(/[\s()-]/g, "").replace(/^\+/, "").replace(/^0/, "254");
  if (!/^254[17]\d{8}$/.test(phone)) throw new Error("Enter a valid Kenyan mobile number beginning 01 or 07.");
  return phone;
}
export function normalizeReceipt(input: string): string {
  const code = input.trim().toUpperCase();
  if (!/^[A-Z0-9]{10}$/.test(code)) throw new Error("Enter the 10-character M-Pesa receipt code.");
  return code;
}
export function renewedExpiry(previous: Date | null, now: Date): Date {
  return new Date(Math.max(previous?.getTime() ?? 0, now.getTime()) + TUITION.days * 86400000);
}

export const FINANCIAL_FIELDS = Object.freeze({
  manager: Object.freeze([
    "contractValue", "clientPaid", "clientOutstanding", "platformFee",
    "professionalAllocation", "professionalPaid", "professionalOutstanding",
    "heldAmount", "refundAmount", "paymentStatus", "settlementStatus", "settlementHistory",
  ]),
  client: Object.freeze([
    "contractValue", "clientPaid", "clientOutstanding", "invoiceStatus",
    "milestones", "receipts", "refundAmount",
  ]),
  team_member: Object.freeze([
    "professionalAllocation", "approvedMilestoneEarnings", "professionalOutstanding",
    "professionalPaid", "heldAmount", "nextSettlementDate",
  ]),
});

const EMPTY_FINANCIAL_RECORD = Object.freeze({
  projectId: null,
  currency: null,
  contractValue: null,
  clientPaid: null,
  clientOutstanding: null,
  platformFee: null,
  professionalAllocation: null,
  approvedMilestoneEarnings: null,
  professionalPaid: null,
  professionalOutstanding: null,
  heldAmount: null,
  refundAmount: null,
  paymentStatus: null,
  settlementStatus: null,
  invoiceStatus: null,
  nextSettlementDate: null,
  milestones: [],
  receipts: [],
  settlementHistory: [],
});

export function normalizeFinancialRecord(record = {}) {
  return { ...EMPTY_FINANCIAL_RECORD, ...record };
}

export function financialValue(value) {
  if (value === null || value === undefined || value === "") return "Not yet connected";
  if (Array.isArray(value) && value.length === 0) return "Not available";
  return String(value);
}

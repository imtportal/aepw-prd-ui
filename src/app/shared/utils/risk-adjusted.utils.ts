/** Parses a reported-value string (may contain thousands separators) into a number, or null if not parseable. */
export function parseReportedValue(value: string | null | undefined): number | null {
  if (!value) return null;
  const n = parseFloat(value.replace(/,/g, ''));
  return isNaN(n) ? null : n;
}

/** Risk Adjusted value = Reported value × Risk % / 100. */
export function calculateRiskAdjustedValue(
  reportedValue: string | null | undefined,
  riskFactor: number | null | undefined,
): number | null {
  const reported = parseReportedValue(reportedValue);
  if (reported == null || riskFactor == null) return null;
  return reported * riskFactor / 100;
}

/** Rounds a number to 2 decimal places. */
export function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Formats a number by thousands, millions or billions.
 * @param {number} value The value that will be formated
 * @returns A formatted value with a suffix or K, M or B.
 */
export function formatCurrency(value) {
  const intPart = value.toString().split(".")[0];
  let formattedVal = "";

  if (intPart.length >= 3 && intPart.length < 6) {
    formattedVal = `$${(value / 1e3).toFixed(2)}K`;
  } else if (intPart.length >= 6 && intPart.length < 9) {
    formattedVal = `$${(value / 1e6).toFixed(2)}M`;
  } else if (intPart.length > 9) {
    formattedVal = `$${(value / 1e9).toFixed(2)}B`;
  } else {
    formattedVal = `$${value.toFixed(2)}`
  }

  return formattedVal;
}

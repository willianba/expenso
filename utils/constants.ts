export enum Environment {
  DEVELOPMENT = "dev",
  PRODUCTION = "prod",
}

export enum PaymentType {
  FIXED = "fixed",
  OVER_TIME = "over_time",
  CURRENT = "current",
}

export const months: Record<number, string> = {
  1: "January",
  2: "February",
  3: "March",
  4: "April",
  5: "May",
  6: "June",
  7: "July",
  8: "August",
  9: "September",
  10: "October",
  11: "November",
  12: "December",
};

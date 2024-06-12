export const getFormattedDate = (date: Date | string) => {
  // TODO at some point make this come from user settings
  return Intl.DateTimeFormat("pt-BR").format(new Date(date));
};

export const formDate = (date?: Date) => {
  if (!date) {
    return new Date().toISOString().split("T")[0];
  }
  return new Date(date).toISOString().split("T")[0];
};

export const today = () => {
  const date = new Date();
  return stripDate(date);
};

export const stripDate = (date: Date) => {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();

  return { year, month, day };
};

export const daysInMonth = (month: number, year: number) => {
  // this is a hack. day 0 returns the last day of the previous month
  return new Date(year, month, 0).getDate();
};

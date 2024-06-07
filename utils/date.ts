export const getFormattedDate = (date: Date | string) => {
  // TODO at some point make this come from user settings
  return Intl.DateTimeFormat("pt-BR").format(new Date(date));
};

export const formToday = () => {
  return new Date().toISOString().split("T")[0];
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

export const getFormattedDate = (date: Date) => {
  const { year, month, day } = stripDate(date);
  const formattedDate = `${year}-${month < 10 ? "0" : ""}${month}-${
    day < 10 ? "0" : ""
  }${day}`;

  return new Date(formattedDate);
};

export const today = () => {
  const date = new Date();
  return stripDate(date);
};

const stripDate = (date: Date) => {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();

  return { year, month, day };
};

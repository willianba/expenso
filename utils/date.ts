export const getFormattedDate = (date?: Date) => {
  const input = date ?? new Date();
  const year = input.getFullYear();
  const month = input.getMonth() + 1;
  const day = input.getDate();
  const formattedDate = `${year}-${month < 10 ? "0" : ""}${month}-${
    day < 10 ? "0" : ""
  }${day}`;

  return new Date(formattedDate);
};

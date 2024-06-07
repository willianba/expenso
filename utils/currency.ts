export const formatCurrency = (value: number) => {
  // TODO at some point make this come from user settings
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
};

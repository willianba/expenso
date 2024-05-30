
export const ReportKeys = {
  reportByDate: (userId: string, month: number, year: number) =>
    ["report", userId, month, year] as const,
};

export type Report = {
  id: string; // ULID
  month: number;
  year: number;
  user: User; // ULID
};

export type RawReport = Omit<Report, "user"> & {
  userId: string;
};

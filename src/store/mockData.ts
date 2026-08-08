import type { Device, Expense, FilterEntry, Installation, MonthlyTotalRevenue, PartnerSplit } from "@/types";

export const mockDevices: Device[] = [];

export const mockFilterEntries: FilterEntry[] = [];

export const mockInstallations: Installation[] = [];

export const mockExpenses: Expense[] = [];

export const mockMonthlyRevenues: MonthlyTotalRevenue[] = [];

export const mockPartnerSplit: PartnerSplit = {
  partner1_name: "שותף א׳",
  partner2_name: "שותף ב׳",
  partner1_percent: 50,
  partner2_percent: 50,
};

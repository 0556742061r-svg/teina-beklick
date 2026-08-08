import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type { Device, Expense, FilterEntry, Installation, MonthlyTotalRevenue, PartnerSplit } from "@/types";
import {
  mockDevices,
  mockExpenses,
  mockFilterEntries,
  mockInstallations,
  mockMonthlyRevenues,
  mockPartnerSplit,
} from "./mockData";

function uid(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

interface StoreShape {
  devices: Device[];
  addDevice: (d: Omit<Device, "id" | "created_at">) => void;
  updateDevice: (id: string, patch: Partial<Device>) => void;
  removeDevice: (id: string) => void;

  filterEntries: FilterEntry[];
  addFilterEntry: (f: Omit<FilterEntry, "id" | "created_at">) => void;
  updateFilterEntry: (id: string, patch: Partial<FilterEntry>) => void;
  removeFilterEntry: (id: string) => void;
  promoteFilterEntry: (id: string) => void;

  installations: Installation[];
  addInstallation: (i: Omit<Installation, "id" | "created_at">) => void;
  updateInstallation: (id: string, patch: Partial<Installation>) => void;

  expenses: Expense[];
  addExpense: (e: Omit<Expense, "id">) => void;
  updateExpense: (id: string, patch: Partial<Expense>) => void;
  removeExpense: (id: string) => void;

  monthlyRevenues: MonthlyTotalRevenue[];
  setMonthlyRevenue: (month: number, year: number, revenue: number) => void;

  partnerSplit: PartnerSplit;
}

const StoreContext = createContext<StoreShape | null>(null);

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [devices, setDevices] = useState<Device[]>(mockDevices);
  const [filterEntries, setFilterEntries] = useState<FilterEntry[]>(mockFilterEntries);
  const [installations, setInstallations] = useState<Installation[]>(mockInstallations);
  const [expenses, setExpenses] = useState<Expense[]>(mockExpenses);
  const [monthlyRevenues, setMonthlyRevenues] = useState<MonthlyTotalRevenue[]>(mockMonthlyRevenues);
  const [partnerSplit] = useState<PartnerSplit>(mockPartnerSplit);

  const value = useMemo<StoreShape>(
    () => ({
      devices,
      addDevice: (d) => setDevices((prev) => [{ ...d, id: uid("d"), created_at: new Date().toISOString() }, ...prev]),
      updateDevice: (id, patch) => setDevices((prev) => prev.map((d) => (d.id === id ? { ...d, ...patch } : d))),
      removeDevice: (id) => setDevices((prev) => prev.filter((d) => d.id !== id)),

      filterEntries,
      addFilterEntry: (f) =>
        setFilterEntries((prev) => [{ ...f, id: uid("f"), created_at: new Date().toISOString() }, ...prev]),
      updateFilterEntry: (id, patch) =>
        setFilterEntries((prev) => prev.map((f) => (f.id === id ? { ...f, ...patch } : f))),
      removeFilterEntry: (id) => setFilterEntries((prev) => prev.filter((f) => f.id !== id)),
      promoteFilterEntry: (id) => {
        const entry = filterEntries.find((f) => f.id === id);
        if (!entry) return;
        setInstallations((prev) => [
          {
            id: uid("i"),
            institution_name: entry.institution_name,
            phone: entry.phone,
            contact_person: entry.contact_person,
            address: entry.location,
            institution_type: "synagogue",
            notes: entry.notes,
            status: "חדש",
            source_type: "filter",
            is_private: entry.is_private,
            milestone_contact: false,
            milestone_agreement: false,
            milestone_survey: false,
            milestone_installed: false,
            monthly_goal: 5,
            created_at: new Date().toISOString(),
          },
          ...prev,
        ]);
        setFilterEntries((prev) => prev.filter((f) => f.id !== id));
      },

      installations,
      addInstallation: (i) =>
        setInstallations((prev) => [{ ...i, id: uid("i"), created_at: new Date().toISOString() }, ...prev]),
      updateInstallation: (id, patch) =>
        setInstallations((prev) =>
          prev.map((i) => {
            if (i.id !== id) return i;
            const next = { ...i, ...patch };
            if (patch.milestone_installed && !i.milestone_installed) {
              setDevices((prevD) => [
                {
                  id: uid("d"),
                  name: i.institution_name,
                  category: i.institution_type,
                  address: i.address,
                  status: "active",
                  purchase_price: 4200,
                  monthly_revenue: 0,
                  roi_enabled: true,
                  gabbai_name: i.contact_person,
                  gabbai_phone: i.phone,
                  commission_percent: 8,
                  device_count: 1,
                  created_at: new Date().toISOString(),
                },
                ...prevD,
              ]);
            }
            return next;
          })
        ),

      expenses,
      addExpense: (e) => setExpenses((prev) => [{ ...e, id: uid("e") }, ...prev]),
      updateExpense: (id, patch) => setExpenses((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e))),
      removeExpense: (id) => setExpenses((prev) => prev.filter((e) => e.id !== id)),

      monthlyRevenues,
      setMonthlyRevenue: (month, year, revenue) =>
        setMonthlyRevenues((prev) => {
          const exists = prev.find((r) => r.month === month && r.year === year);
          if (exists) return prev.map((r) => (r.month === month && r.year === year ? { ...r, revenue } : r));
          return [{ id: uid("r"), month, year, revenue }, ...prev];
        }),

      partnerSplit,
    }),
    [devices, filterEntries, installations, expenses, monthlyRevenues, partnerSplit]
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

function useStoreContext() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("Store hooks must be used within AppDataProvider");
  return ctx;
}

export function useDevices() {
  const { devices, addDevice, updateDevice, removeDevice } = useStoreContext();
  return { devices, addDevice, updateDevice, removeDevice };
}

export function useFilterEntries() {
  const { filterEntries, addFilterEntry, updateFilterEntry, removeFilterEntry, promoteFilterEntry } = useStoreContext();
  return { filterEntries, addFilterEntry, updateFilterEntry, removeFilterEntry, promoteFilterEntry };
}

export function useInstallations() {
  const { installations, addInstallation, updateInstallation } = useStoreContext();
  return { installations, addInstallation, updateInstallation };
}

export function useExpenses() {
  const { expenses, addExpense, updateExpense, removeExpense } = useStoreContext();
  return { expenses, addExpense, updateExpense, removeExpense };
}

export function useFinances() {
  const { monthlyRevenues, setMonthlyRevenue, expenses, partnerSplit, devices } = useStoreContext();
  return { monthlyRevenues, setMonthlyRevenue, expenses, partnerSplit, devices };
}

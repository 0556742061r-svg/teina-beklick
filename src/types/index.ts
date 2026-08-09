  export type DeviceCategory =
  | "synagogue"
  | "kollel"
  | "yeshiva"
  | "business"
  | "seminary"
  | "personal"
  | "street"
  | "mikveh";

export const categoryLabels: Record<DeviceCategory, string> = {
  synagogue: "בית כנסת",
  kollel: "כולל",
  yeshiva: "ישיבה",
  business: "בית עסק",
  seminary: "סמינר",
  personal: "פרטי",
  street: "רחוב",
  mikveh: "מקווה",
};

export type DeviceStatus = "active" | "inactive" | "maintenance";

export const statusLabels: Record<DeviceStatus, string> = {
  active: "פעיל",
  inactive: "לא פעיל",
  maintenance: "בתחזוקה",
};

export interface Device {
  id: string;
  name: string;
  category: DeviceCategory;
  address: string;
  lat?: number;
  lng?: number;
  status: DeviceStatus;
  purchase_price: number;
  monthly_revenue: number;
  roi_enabled: boolean;
  gabbai_name: string;
  gabbai_phone: string;
  commission_percent: number;
  gabbai_user_id?: string;
  device_count: number;
  image_url?: string;
  created_at: string;
}

export interface FilterEntry {
  id: string;
  institution_name: string;
  contact_person: string;
  phone: string;
  location: string;
  traffic: string;
  status: string;
  source: string;
  notes: string;
  lead_rating: number;
  is_private: boolean;
  created_at: string;
}

export interface Installation {
  id: string;
  institution_name: string;
  phone: string;
  contact_person: string;
  address: string;
  institution_type: DeviceCategory;
  notes: string;
  status: string;
  source_type: "direct" | "filter";
  is_private: boolean;
  milestone_contact: boolean;
  milestone_agreement: boolean;
  milestone_survey: boolean;
  milestone_installed: boolean;
  monthly_goal: number;
  scheduled_at?: string;
  closed_at?: string;
  created_at: string;
  has_active_reminder?: boolean;
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: string;
  payer: "partner1" | "partner2";
}

export interface MonthlyTotalRevenue {
  id: string;
  month: number;
  year: number;
  revenue: number;
}

export interface PartnerSplit {
  partner1_name: string;
  partner2_name: string;
  partner1_percent: number;
  partner2_percent: number;
}

export interface InstallationPoint {
  id: string;
  title: string;
  lat: number;
  lng: number;
  photo_url: string | null;
  notes: string | null;
  status: "pending" | "installed";
  created_at: string;
}

export interface GabbaiPayment {
  id: string;
  device_id: string;
  amount: number;
  paid_at: string;
}

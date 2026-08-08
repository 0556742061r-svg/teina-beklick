import { HelpCircle } from "lucide-react";
import { toast } from "sonner";

export function HelpButton() {
  return (
    <button
      onClick={() => toast.info("סיור הדרכה למסך זה יופעל כאן (driver.js)")}
      className="fixed bottom-6 left-6 z-30 flex h-11 w-11 items-center justify-center rounded-full bg-gradient-brand text-white shadow-elevated transition-transform hover:scale-105"
      aria-label="עזרה"
    >
      <HelpCircle className="h-5 w-5" strokeWidth={1.75} />
    </button>
  );
}

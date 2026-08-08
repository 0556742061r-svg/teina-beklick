import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MailX } from "lucide-react";

export default function UnsubscribePage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4" dir="rtl">
      <Card className="w-full max-w-sm text-center">
        <CardHeader className="items-center">
          <MailX className="h-8 w-8 text-muted-foreground mb-2" strokeWidth={1.5} />
          <CardTitle>הוסרת מרשימת התפוצה</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">לא תקבל/י יותר מיילים מהמערכת. ניתן לחזור בכל עת בפניה אלינו.</p>
        </CardContent>
      </Card>
    </div>
  );
}

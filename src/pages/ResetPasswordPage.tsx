import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "sonner";

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("");
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-brand p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center text-center">
          <CardTitle>איפוס סיסמה</CardTitle>
          <p className="text-xs text-muted-foreground">נשלח אליך קישור לאיפוס לכתובת המייל</p>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label>אימייל</Label>
            <Input dir="ltr" className="mt-1" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <Button variant="brand" className="w-full" onClick={() => toast.success("קישור לאיפוס נשלח למייל")}>
            שליחת קישור
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

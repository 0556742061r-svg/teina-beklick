import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "sonner";

export default function AuthPage({ gabbai = false }: { gabbai?: boolean }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function login() {
    if (!email || !password) {
      toast.error("יש למלא אימייל וסיסמה");
      return;
    }
    toast.success("התחברת בהצלחה");
    navigate(gabbai ? "/gabbai-portal" : "/");
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-brand p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-gradient-brand text-white font-extrabold text-sm mb-2">TK</div>
          <CardTitle>{gabbai ? "כניסת גבאים" : "כניסה למערכת"}</CardTitle>
          <p className="text-xs text-muted-foreground">טעינה בקליק · ניהול רב-קו</p>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label>אימייל</Label>
            <Input dir="ltr" className="mt-1" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
          </div>
          <div>
            <Label>סיסמה</Label>
            <Input dir="ltr" type="password" className="mt-1" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <Button variant="brand" className="w-full" onClick={login}>התחברות</Button>
          <button className="text-xs text-muted-foreground w-full text-center hover:underline" onClick={() => navigate("/reset-password")}>
            שכחתי סיסמה
          </button>
        </CardContent>
      </Card>
    </div>
  );
}

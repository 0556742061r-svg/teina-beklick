import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useInstallations } from "@/store/useStore";
import { useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, XCircle } from "lucide-react";

export default function PartnerFeedbackPage() {
  const { id } = useParams();
  const { installations } = useInstallations();
  const lead = installations.find((i) => i.id === id) ?? installations[0];
  const [notes, setNotes] = useState("");
  const [decision, setDecision] = useState<null | "approved" | "rejected">(null);

  function submit(d: "approved" | "rejected") {
    setDecision(d);
    toast.success(d === "approved" ? "הליד אושר, תודה!" : "הליד נדחה, תודה על המשוב");
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4" dir="rtl">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>אישור/דחייה של ליד</CardTitle>
          <p className="text-xs text-muted-foreground">{lead?.institution_name}</p>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">{lead?.address}</p>
          {decision ? (
            <div className={`rounded-lg p-4 text-center text-sm font-medium ${decision === "approved" ? "bg-accent/10 text-accent" : "bg-destructive/10 text-destructive"}`}>
              {decision === "approved" ? "תודה, הליד אושר." : "תודה, הליד נדחה."}
            </div>
          ) : (
            <>
              <Textarea placeholder="הערות (לא חובה)" value={notes} onChange={(e) => setNotes(e.target.value)} />
              <div className="flex gap-2">
                <Button variant="brand" className="flex-1" onClick={() => submit("approved")}>
                  <CheckCircle2 className="h-4 w-4" /> אישור
                </Button>
                <Button variant="outline" className="flex-1" onClick={() => submit("rejected")}>
                  <XCircle className="h-4 w-4" /> דחייה
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

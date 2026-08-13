import { useEffect, useRef, useState } from "react";
import { Mic, Square, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";

const BUCKET = "expense-voice-notes";

type RecordingStatus = "idle" | "recording" | "uploading";

export function VoiceExpenseRecorder() {
  const [status, setStatus] = useState<RecordingStatus>("idle");
  const [seconds, setSeconds] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mimeType = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/mp4";
      const recorder = new MediaRecorder(stream, { mimeType });
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        void uploadRecording(blob);
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setStatus("recording");
      setSeconds(0);
      timerRef.current = window.setInterval(() => setSeconds((s) => s + 1), 1000);
    } catch {
      toast.error("לא הצלחנו לגשת למיקרופון. יש לאשר הרשאה בדפדפן ולנסות שוב.");
    }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    if (timerRef.current) window.clearInterval(timerRef.current);
    setStatus("uploading");
  }

  async function uploadRecording(blob: Blob) {
    const recordedSeconds = seconds;
    try {
      const fileName = `note-${Date.now()}.webm`;
      const { error: uploadError } = await supabase.storage.from(BUCKET).upload(fileName, blob, {
        contentType: blob.type || "audio/webm",
      });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(fileName);

      const { error: insertError } = await supabase.from("voice_expense_notes").insert({
        audio_url: urlData.publicUrl,
        duration_seconds: recordedSeconds,
        status: "pending",
      });
      if (insertError) throw insertError;

      toast.success("ההקלטה נשמרה! אפשר לתמלל אותה מהמחשב מאוחר יותר.");
    } catch (err) {
      console.error(err);
      toast.error("שמירת ההקלטה נכשלה. יש לבדוק את החיבור לאינטרנט ולנסות שוב.");
    } finally {
      setStatus("idle");
      setSeconds(0);
    }
  }

  function handlePress() {
    if (status === "idle") startRecording();
    else if (status === "recording") stopRecording();
  }

  function formatTime(s: number) {
    const m = Math.floor(s / 60).toString().padStart(2, "0");
    const sec = (s % 60).toString().padStart(2, "0");
    return `${m}:${sec}`;
  }

  return (
    <div className="fixed bottom-6 left-6 z-50 flex flex-col items-center gap-2">
      {status === "recording" && (
        <div className="rounded-full bg-black/80 text-white text-xs px-3 py-1 font-mono tabular-nums">
          {formatTime(seconds)}
        </div>
      )}
      <button
        type="button"
        onClick={handlePress}
        disabled={status === "uploading"}
        className={`h-16 w-16 rounded-full shadow-lg flex items-center justify-center transition-transform active:scale-95
          ${status === "recording" ? "bg-red-600 animate-pulse scale-110" : "bg-gradient-to-br from-orange-500 to-red-500 hover:scale-105"}
          ${status === "uploading" ? "opacity-70" : ""}`}
        aria-label={status === "recording" ? "עצור הקלטה" : "התחל הקלטת הוצאה"}
      >
        {status === "uploading" ? (
          <Loader2 className="h-7 w-7 text-white animate-spin" />
        ) : status === "recording" ? (
          <Square className="h-6 w-6 text-white" fill="white" />
        ) : (
          <Mic className="h-7 w-7 text-white" />
        )}
      </button>
      {status === "idle" && (
        <span className="text-[11px] text-muted-foreground bg-background/90 px-2 py-0.5 rounded-full shadow-sm border border-border">
          הקלט הוצאה
        </span>
      )}
      {status === "recording" && (
        <span className="text-[11px] text-white bg-red-600 px-2 py-0.5 rounded-full shadow-sm">
          מקליט... לחצו לעצירה
        </span>
      )}
    </div>
  );
}

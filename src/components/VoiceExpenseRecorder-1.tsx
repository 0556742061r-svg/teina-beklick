import { useEffect, useRef, useState } from "react";
import { Mic, Square, Loader2, CloudOff } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";

const BUCKET = "expense-voice-notes";
const DB_NAME = "teina-voice-notes";
const STORE_NAME = "pending-recordings";

interface PendingRecording {
  id: string;
  blob: Blob;
  durationSeconds: number;
  createdAt: number;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function savePendingRecording(rec: PendingRecording) {
  const db = await openDb();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).put(rec);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function deletePendingRecording(id: string) {
  const db = await openDb();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function getAllPendingRecordings(): Promise<PendingRecording[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const req = tx.objectStore(STORE_NAME).getAll();
    req.onsuccess = () => resolve(req.result as PendingRecording[]);
    req.onerror = () => reject(req.error);
  });
}

async function uploadToSupabase(blob: Blob, durationSeconds: number) {
  const fileName = `note-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.webm`;
  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(fileName, blob, {
    contentType: blob.type || "audio/webm",
  });
  if (uploadError) throw uploadError;

  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(fileName);

  const { error: insertError } = await supabase.from("voice_expense_notes").insert({
    audio_url: urlData.publicUrl,
    duration_seconds: durationSeconds,
    status: "pending",
  });
  if (insertError) throw insertError;
}

type RecordingStatus = "idle" | "recording" | "uploading";

export function VoiceExpenseRecorder() {
  const [status, setStatus] = useState<RecordingStatus>("idle");
  const [seconds, setSeconds] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number | null>(null);
  const secondsRef = useRef(0);

  async function refreshPendingCount() {
    try {
      const pending = await getAllPendingRecordings();
      setPendingCount(pending.length);
    } catch {
      // IndexedDB not available - ignore, badge just won't show
    }
  }

  async function flushPending() {
    let pending: PendingRecording[] = [];
    try {
      pending = await getAllPendingRecordings();
    } catch {
      return;
    }
    let sentAny = false;
    for (const rec of pending) {
      try {
        await uploadToSupabase(rec.blob, rec.durationSeconds);
        await deletePendingRecording(rec.id);
        sentAny = true;
      } catch {
        // still no connection / still failing - keep it for the next attempt
      }
    }
    if (sentAny) toast.success("הקלטה שהמתינה נשלחה בהצלחה!");
    void refreshPendingCount();
  }

  useEffect(() => {
    void refreshPendingCount();
    void flushPending();
    const onOnline = () => void flushPending();
    window.addEventListener("online", onOnline);
    const interval = window.setInterval(() => void flushPending(), 30000);
    return () => {
      window.removeEventListener("online", onOnline);
      window.clearInterval(interval);
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
        void handleRecordingFinished(blob);
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setStatus("recording");
      setSeconds(0);
      secondsRef.current = 0;
      timerRef.current = window.setInterval(() => {
        secondsRef.current += 1;
        setSeconds(secondsRef.current);
      }, 1000);
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

  async function handleRecordingFinished(blob: Blob) {
    const recordedSeconds = secondsRef.current;
    const localId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    // Save locally FIRST, before attempting any network call.
    // This guarantees the recording is never lost even with no reception at all,
    // or if the tab is closed right after stopping.
    try {
      await savePendingRecording({ id: localId, blob, durationSeconds: recordedSeconds, createdAt: Date.now() });
    } catch (err) {
      console.error(err);
      toast.error("שמירת ההקלטה נכשלה. נסו שוב, רצוי במקום עם קליטה יציבה יותר.");
      setStatus("idle");
      setSeconds(0);
      return;
    }
    void refreshPendingCount();

    try {
      await uploadToSupabase(blob, recordedSeconds);
      await deletePendingRecording(localId);
      void refreshPendingCount();
      toast.success("ההקלטה נשמרה ונשלחה בהצלחה!");
    } catch (err) {
      console.error(err);
      toast.warning("אין חיבור כרגע — ההקלטה נשמרה בטלפון בבטחה ותישלח אוטומטית כשהחיבור יחזור.");
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
      <div className="relative">
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
        {pendingCount > 0 && status !== "recording" && (
          <div
            className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center border-2 border-white"
            title="הקלטות שמורות בטלפון וממתינות לשליחה"
          >
            {pendingCount}
          </div>
        )}
      </div>
      {status === "idle" && pendingCount === 0 && (
        <span className="text-[11px] text-muted-foreground bg-background/90 px-2 py-0.5 rounded-full shadow-sm border border-border">
          הקלט הוצאה
        </span>
      )}
      {status === "idle" && pendingCount > 0 && (
        <span className="text-[11px] text-white bg-amber-600 px-2 py-0.5 rounded-full shadow-sm flex items-center gap-1">
          <CloudOff className="h-3 w-3" /> ממתין לשליחה
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

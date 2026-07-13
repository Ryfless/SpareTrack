import { useState, useEffect, useRef } from "react";
import { Mail } from "lucide-react";
import { toast } from "sonner";

export function OTPPage({ onSuccess, onBack }: { onSuccess: () => void; onBack: () => void }) {
  const [otp, setOtp] = useState(["","","","","",""]);
  const [secs, setSecs] = useState(60);
  const refs = Array.from({ length: 6 }, () => useRef<HTMLInputElement>(null));
  useEffect(() => { const t = setInterval(() => setSecs(s => Math.max(s-1, 0)), 1000); return () => clearInterval(t); }, []);
  function inp(i: number, val: string) {
    const d = val.replace(/\D/,"").slice(-1); const n = [...otp]; n[i] = d; setOtp(n);
    if (d && i < 5) refs[i+1].current?.focus();
  }
  function kd(i: number, e: React.KeyboardEvent) { if (e.key === "Backspace" && !otp[i] && i > 0) refs[i-1].current?.focus(); }
  function paste(e: React.ClipboardEvent) {
    const p = e.clipboardData.getData("text").replace(/\D/g,"").slice(0,6);
    const n = [...otp]; p.split("").forEach((c, i) => { n[i] = c; }); setOtp(n);
    refs[Math.min(p.length,5)].current?.focus(); e.preventDefault();
  }
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-6">
      <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm text-center">
        <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center mb-4 mx-auto"><Mail size={20} className="text-emerald-600" /></div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-1">Masukkan Kode OTP</h2>
        <p className="text-sm text-slate-400 mb-6">Kode 6 digit telah dikirim ke email Anda</p>
        <div className="flex justify-center gap-2 mb-6" onPaste={paste}>
          {otp.map((d, i) => (
            <input key={i} ref={refs[i]} value={d} onChange={e => inp(i, e.target.value)} onKeyDown={e => kd(i, e)} maxLength={1}
              className="w-11 h-12 text-center text-xl font-bold border-2 border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl outline-none focus:border-blue-500 transition" />
          ))}
        </div>
        <button onClick={() => { if (otp.join("").length < 6) { toast.error("Masukkan 6 digit kode OTP"); return; } toast.success("Verifikasi berhasil!"); onSuccess(); }} className="w-full py-3 text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 active:scale-95 rounded-xl transition-all mb-3">Verifikasi</button>
        {secs > 0 ? <p className="text-xs text-slate-400">Kirim ulang dalam <strong>{secs}s</strong></p> : <button onClick={() => { setSecs(60); toast.success("Kode baru dikirim"); }} className="text-xs text-blue-600 hover:underline">Kirim Ulang</button>}
        <button onClick={onBack} className="block w-full mt-3 py-2 text-sm text-slate-500 hover:text-slate-700 transition">← Kembali</button>
      </div>
    </div>
  );
}

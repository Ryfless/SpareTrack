import { useState, useEffect, useRef } from "react";
import { Mail, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { verifyOtp, requestOtp } from "../../services/auth";

export function OTPPage({ email, onSuccess, onBack }: { email: string; onSuccess: () => void; onBack: () => void }) {
  const [otp, setOtp] = useState(["","","","","","","",""]);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [secs, setSecs] = useState(60);
  const [cooldown, setCooldown] = useState(0);
  const refs = Array.from({ length: 8 }, () => useRef<HTMLInputElement>(null));
  useEffect(() => { const t = setInterval(() => setSecs(s => Math.max(s-1, 0)), 1000); return () => clearInterval(t); }, []);
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown(s => Math.max(s - 1, 0)), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  function getOtpError(err: unknown): string {
    if (err instanceof Error) console.error('[OTP Error]', err.message, err);
    const msg = err instanceof Error ? err.message : "";
    if (msg.includes("429") || msg.includes("rate") || msg.includes("Too Many Requests") || msg.includes("over_email_send_rate_limit")) {
      return "Terlalu banyak permintaan. Silakan tunggu beberapa saat.";
    }
    if (msg.includes("otp_expired") || msg.includes("Token has expired") || msg.includes("expired")) {
      return "Kode OTP sudah kedaluwarsa. Silakan kirim ulang.";
    }
    if (msg.includes("otp") || msg.includes("token") || msg.includes("invalid")) {
      return "Kode OTP yang Anda masukkan salah.";
    }
    return msg || "Kode OTP yang Anda masukkan salah.";
  }

  async function handleVerify() {
    if (otp.join("").length < 8) { toast.error("Masukkan 8 digit kode OTP"); return; }
    setLoading(true);
    try {
      const result = await verifyOtp(email, otp.join(""));
      if (!result?.user) {
        toast.error("Kode OTP yang Anda masukkan salah.");
        return;
      }
      toast.success("Verifikasi berhasil!");
      onSuccess();
    } catch (err: unknown) {
      const m = getOtpError(err);
      toast.error(m);
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setResendLoading(true);
    try {
      await requestOtp(email);
      setSecs(60);
      toast.success("Kode baru dikirim");
    } catch (err: unknown) {
      const m = getOtpError(err);
      toast.error(m);
      if (m.includes("Terlalu banyak")) setCooldown(60);
    } finally {
      setResendLoading(false);
    }
  }

  function inp(i: number, val: string) {
    const d = val.replace(/\D/,"").slice(-1); const n = [...otp]; n[i] = d; setOtp(n);
    if (d && i < 7) refs[i+1].current?.focus();
  }
  function kd(i: number, e: React.KeyboardEvent) { if (e.key === "Backspace" && !otp[i] && i > 0) refs[i-1].current?.focus(); }
  function paste(e: React.ClipboardEvent) {
    const p = e.clipboardData.getData("text").replace(/\D/g,"").slice(0,8);
    const n = [...otp]; p.split("").forEach((c, i) => { n[i] = c; }); setOtp(n);
    refs[Math.min(p.length,7)].current?.focus(); e.preventDefault();
  }
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm text-center">
        <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center mb-4 mx-auto"><Mail size={20} className="text-emerald-600" /></div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-1">Masukkan Kode OTP</h2>
        <p className="text-sm text-slate-400 mb-6">Kode 8 digit telah dikirim ke email Anda</p>
        <div className="flex justify-center gap-2 mb-6" onPaste={paste}>
          {otp.map((d, i) => (
            <input key={i} ref={refs[i]} value={d} onChange={e => inp(i, e.target.value)} onKeyDown={e => kd(i, e)} maxLength={1}
              className="w-10 h-12 text-center text-xl font-bold border-2 border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl outline-none focus:border-blue-500 transition" />
          ))}
        </div>
        <button onClick={handleVerify} disabled={loading} className="w-full flex items-center justify-center gap-2 py-3 text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 active:scale-95 rounded-xl transition-all disabled:opacity-70 mb-3">
          {loading ? <><Loader2 size={15} className="animate-spin" />Memverifikasi...</> : "Verifikasi"}
        </button>
        {secs > 0 && !cooldown ? (
          <p className="text-xs text-slate-400">Kirim ulang dalam <strong>{secs}s</strong></p>
        ) : cooldown > 0 ? (
          <p className="text-xs text-amber-600">Tunggu <strong>{cooldown}s</strong> untuk kirim ulang</p>
        ) : (
          <button onClick={handleResend} disabled={resendLoading} className="text-xs text-blue-600 hover:underline disabled:opacity-50">
            {resendLoading ? "Mengirim..." : "Kirim Ulang"}
          </button>
        )}
        <button onClick={onBack} className="block w-full mt-3 py-2 text-sm text-slate-500 hover:text-slate-700 transition">← Kembali</button>
      </div>
    </div>
  );
}

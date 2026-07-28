import { useState, useEffect } from "react";
import { Lock, Mail, ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { FormField } from "../../components/shared/FormField";
import { inputCls } from "../../config";
import { requestOtp } from "../../services/auth";

export function ForgotPage({ onOTP, onLogin }: { onOTP: (email: string) => void; onLogin: () => void }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown(s => Math.max(s - 1, 0)), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  async function handleRequestOtp() {
    if (!email) { toast.error("Masukkan email Anda"); return; }
    if (cooldown > 0) { toast.error(`Tunggu ${cooldown} detik sebelum mencoba lagi`); return; }
    setLoading(true);
    try {
      await requestOtp(email);
      toast.success(`Kode OTP dikirim ke ${email}`);
      setLoading(false);
      onOTP(email);
      return;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal mengirim OTP";
      if (msg.includes("429") || msg.includes("rate") || msg.includes("Too Many Requests") || msg.includes("over_email_send_rate_limit")) {
        toast.error("Terlalu banyak permintaan. Silakan tunggu 60 detik.");
        setCooldown(60);
      } else {
        toast.error(msg);
      }
      setLoading(false);
    }
  }
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-6">
      <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mb-4"><Lock size={20} className="text-blue-600" /></div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-1">Lupa Password?</h2>
        <p className="text-sm text-slate-400 mb-5">Masukkan email dan kami akan mengirim kode verifikasi.</p>
        <FormField label="Email" required><div className="relative"><Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="email@domain.com" className={`${inputCls} pl-9`} onKeyDown={e => { if (e.key==="Enter") handleRequestOtp(); }} /></div></FormField>
        <button onClick={handleRequestOtp} disabled={loading || cooldown > 0} className="w-full mt-4 flex items-center justify-center gap-2 py-3 text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 active:scale-95 rounded-xl transition-all disabled:opacity-70">
          {loading ? <><Loader2 size={15} className="animate-spin" />Mengirim...</> : cooldown > 0 ? `Tunggu ${cooldown}s` : <>Kirim Kode OTP<ArrowRight size={14} /></>}
        </button>
        <button onClick={onLogin} className="w-full mt-3 py-2 text-sm text-slate-500 hover:text-slate-700 transition">← Kembali ke Login</button>
      </div>
    </div>
  );
}

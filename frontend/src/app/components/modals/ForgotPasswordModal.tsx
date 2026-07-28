import { useState, useEffect, useRef } from "react";
import { Mail, Loader2, Lock, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { Modal } from "../shared/Modal";
import { FormField } from "../shared/FormField";
import { inputCls } from "../../config";
import { supabase } from "../../services/supabase";

interface Props {
  open: boolean;
  onClose: () => void;
  email: string;
}

export function ForgotPasswordModal({ open, onClose, email }: Props) {
  const [step, setStep] = useState<"send" | "otp" | "password">("send");
  const [loading, setLoading] = useState(false);
  const [otp, setOtp] = useState(["","","","","","","",""]);
  const [secs, setSecs] = useState(60);
  const [pass, setPass] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const refs = Array.from({ length: 8 }, () => useRef<HTMLInputElement>(null));

  useEffect(() => { if (!open) { setStep("send"); setOtp(["","","","","","","",""]); setPass(""); setConfirm(""); setSecs(60); } }, [open]);
  useEffect(() => { const t = setInterval(() => setSecs(s => Math.max(s-1, 0)), 1000); return () => clearInterval(t); }, [secs > 0]);

  async function handleSendOtp() {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: false } });
      if (error) throw error;
      toast.success("Kode OTP dikirim ke email Anda");
      setStep("otp");
      setSecs(60);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal mengirim OTP");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp() {
    if (otp.join("").length < 8) { toast.error("Masukkan 8 digit kode OTP"); return; }
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.verifyOtp({ email, token: otp.join(""), type: 'email' });
      if (error || !data?.user) { toast.error("Kode OTP yang Anda masukkan salah."); return; }
      toast.success("Verifikasi berhasil");
      setStep("password");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Kode OTP yang Anda masukkan salah.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSavePassword() {
    if (!pass) { toast.error("Masukkan password baru"); return; }
    if (pass.length < 6) { toast.error("Password minimal 6 karakter"); return; }
    if (!confirm) { toast.error("Konfirmasi password wajib diisi"); return; }
    if (pass !== confirm) { toast.error("Konfirmasi password tidak cocok"); return; }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: pass });
      if (error) throw error;
      toast.success("Password berhasil diperbarui");
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal mengubah password");
    } finally {
      setLoading(false);
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
    <Modal open={open} onClose={onClose} title="Atur Ulang Password">
      {step === "send" && (
        <div className="space-y-4">
          <FormField label="Email">
            <input value={email} className={inputCls} disabled />
          </FormField>
          <button onClick={handleSendOtp} disabled={loading} className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 active:scale-95 rounded-xl transition-all disabled:opacity-70">
            {loading ? <><Loader2 size={15} className="animate-spin" />Mengirim...</> : <>Kirim Kode OTP<Mail size={14} /></>}
          </button>
        </div>
      )}

      {step === "otp" && (
        <div className="text-center">
          <p className="text-sm text-slate-400 mb-4">Kode 8 digit telah dikirim ke <strong className="text-slate-700 dark:text-slate-300">{email}</strong></p>
          <div className="flex justify-center gap-2 mb-4" onPaste={paste}>
            {otp.map((d, i) => (
              <input key={i} ref={refs[i]} value={d} onChange={e => inp(i, e.target.value)} onKeyDown={e => kd(i, e)} maxLength={1}
                className="w-10 h-11 text-center text-lg font-bold border-2 border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl outline-none focus:border-blue-500 transition" />
            ))}
          </div>
          <button onClick={handleVerifyOtp} disabled={loading} className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 active:scale-95 rounded-xl transition-all disabled:opacity-70 mb-3">
            {loading ? <><Loader2 size={15} className="animate-spin" />Memverifikasi...</> : "Verifikasi"}
          </button>
          {secs > 0 ? (
            <p className="text-xs text-slate-400">Kirim ulang dalam <strong>{secs}s</strong></p>
          ) : (
            <button onClick={handleSendOtp} disabled={loading} className="text-xs text-blue-600 hover:underline">Kirim Ulang</button>
          )}
        </div>
      )}

      {step === "password" && (
        <div className="space-y-4">
          <FormField label="Password Baru" required>
            <div className="relative">
              <input value={pass} onChange={e => setPass(e.target.value)} type={showPass ? "text" : "password"} placeholder="Minimal 6 karakter" className={`${inputCls} pr-9`} onKeyDown={e => { if (e.key==="Enter") handleSavePassword(); }} />
              <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </FormField>
          <FormField label="Konfirmasi Password" required>
            <div className="relative">
              <input value={confirm} onChange={e => setConfirm(e.target.value)} type={showConfirm ? "text" : "password"} placeholder="Ulangi password" className={`${inputCls} pr-9`} onKeyDown={e => { if (e.key==="Enter") handleSavePassword(); }} />
              <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                {showConfirm ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </FormField>
          <button onClick={handleSavePassword} disabled={loading} className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 active:scale-95 rounded-xl transition-all disabled:opacity-70">
            {loading ? <><Loader2 size={15} className="animate-spin" />Menyimpan...</> : <><Lock size={14} />Simpan Password Baru</>}
          </button>
        </div>
      )}
    </Modal>
  );
}

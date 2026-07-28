import { useState } from "react";
import { Lock, Loader2, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "../../services/supabase";
import { FormField } from "../../components/shared/FormField";
import { inputCls } from "../../config";

export function ResetPasswordPage({ onComplete }: { onComplete: () => void }) {
  const [pass, setPass] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleReset() {
    if (!pass) { toast.error("Masukkan password baru"); return; }
    if (pass.length < 6) { toast.error("Password minimal 6 karakter"); return; }
    if (!confirm) { toast.error("Konfirmasi password wajib diisi"); return; }
    if (pass !== confirm) { toast.error("Konfirmasi password tidak cocok"); return; }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: pass });
      if (error) throw error;
      await supabase.auth.signOut();
      toast.success("Password berhasil diubah. Silakan login dengan password baru.");
      onComplete();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal mengubah password");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-6">
      <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mb-4"><Lock size={20} className="text-blue-600" /></div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-1">Buat Password Baru</h2>
        <p className="text-sm text-slate-400 mb-5">Masukkan password baru untuk akun Anda.</p>
        <div className="space-y-4">
          <FormField label="Password Baru" required>
            <div className="relative">
              <input value={pass} onChange={e => setPass(e.target.value)} type={showPass ? "text" : "password"} placeholder="Minimal 6 karakter" className={`${inputCls} pr-9`} onKeyDown={e => { if (e.key==="Enter") handleReset(); }} />
              <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </FormField>
          <FormField label="Konfirmasi Password" required>
            <div className="relative">
              <input value={confirm} onChange={e => setConfirm(e.target.value)} type={showConfirm ? "text" : "password"} placeholder="Ulangi password" className={`${inputCls} pr-9`} onKeyDown={e => { if (e.key==="Enter") handleReset(); }} />
              <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                {showConfirm ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </FormField>
        </div>
        <button onClick={handleReset} disabled={loading} className="w-full mt-5 flex items-center justify-center gap-2 py-3 text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 active:scale-95 rounded-xl transition-all disabled:opacity-70">
          {loading ? <><Loader2 size={15} className="animate-spin" />Menyimpan...</> : "Simpan Password Baru"}
        </button>
      </div>
    </div>
  );
}

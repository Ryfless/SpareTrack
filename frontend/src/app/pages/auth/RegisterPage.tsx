import { useState } from "react";
import { BarChart3, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { FormField } from "../../components/shared/FormField";
import { BRANCHES_LIST } from "../../data";
import { inputCls } from "../../config";
import { register as registerApi } from "../../services/auth";

export function RegisterPage({ onLogin }: { onLogin: () => void }) {
  const [form, setForm] = useState({ nama: "", email: "", hp: "", pass: "", confirm: "", cabang: "", agree: false });
  const [loading, setLoading] = useState(false);
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm(f => ({ ...f, [k]: (e.target as HTMLInputElement).type === "checkbox" ? (e.target as HTMLInputElement).checked : e.target.value }));
  async function handleRegister() {
    if (!form.nama || !form.email || !form.pass) { toast.error("Lengkapi data wajib"); return; }
    if (form.pass !== form.confirm) { toast.error("Konfirmasi password tidak cocok"); return; }
    if (!form.agree) { toast.error("Setujui syarat dan ketentuan"); return; }
    setLoading(true);
    try {
      await registerApi({ email: form.email, password: form.pass, fullName: form.nama, phone: form.hp, branch: form.cabang });
      toast.success("Akun berhasil dibuat! Silakan login.");
      onLogin();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Registrasi gagal";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-2 mb-8 justify-center"><div className="w-8 h-8 rounded-lg bg-blue-700 flex items-center justify-center"><BarChart3 size={15} className="text-white" /></div><span className="font-bold text-slate-800 dark:text-slate-200">SpareTrack</span></div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-1">Buat Akun Baru</h2>
          <p className="text-sm text-slate-400 mb-5">Isi data diri untuk mendaftar</p>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Nama Lengkap" required><input value={form.nama} onChange={set("nama")} placeholder="Nama Anda" className={inputCls} /></FormField>
              <FormField label="No. HP"><input value={form.hp} onChange={set("hp")} placeholder="08xx" className={inputCls} /></FormField>
            </div>
            <FormField label="Email" required><input value={form.email} onChange={set("email")} type="email" placeholder="email@domain.com" className={inputCls} /></FormField>
            <FormField label="Cabang (opsional)"><select value={form.cabang} onChange={set("cabang")} className={inputCls}><option value="">Pilih cabang</option>{BRANCHES_LIST.map(b => <option key={b}>{b}</option>)}</select></FormField>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Password" required><input value={form.pass} onChange={set("pass")} type="password" placeholder="••••••••" className={inputCls} /></FormField>
              <FormField label="Konfirmasi" required><input value={form.confirm} onChange={set("confirm")} type="password" placeholder="••••••••" className={inputCls} /></FormField>
            </div>
            <label className="flex items-start gap-2 cursor-pointer"><input type="checkbox" checked={form.agree} onChange={set("agree")} className="mt-0.5 rounded" /><span className="text-xs text-slate-600 dark:text-slate-400">Saya menyetujui <span className="text-blue-600">Syarat &amp; Ketentuan</span> dan <span className="text-blue-600">Kebijakan Privasi</span></span></label>
            <button onClick={handleRegister} disabled={loading} className="w-full flex items-center justify-center gap-2 py-3 text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 active:scale-95 rounded-xl transition-all disabled:opacity-70">
              {loading ? <><Loader2 size={15} className="animate-spin" />Mendaftar...</> : "Buat Akun"}
            </button>
          </div>
          <p className="text-center text-sm text-slate-500 mt-4">Sudah punya akun? <button onClick={onLogin} className="text-blue-600 font-medium hover:underline">Masuk</button></p>
        </div>
      </div>
    </div>
  );
}

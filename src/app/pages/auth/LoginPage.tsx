import { useState } from "react";
import { BarChart3, Mail, Lock, Eye, Loader2, Globe } from "lucide-react";
import { toast } from "sonner";
import { FormField } from "../../components/shared/FormField";
import { inputCls } from "../../config";

export function LoginPage({ onSuccess, onRegister, onForgot }: { onSuccess: () => void; onRegister: () => void; onForgot: () => void }) {
  const [email, setEmail] = useState("admin@sparetrack.id");
  const [password, setPassword] = useState("password123");
  const [showPass, setShowPass] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  function login() {
    if (!email || !password) { toast.error("Email dan password wajib diisi"); return; }
    setLoading(true); setTimeout(() => { setLoading(false); onSuccess(); }, 1200);
  }
  return (
    <div className="min-h-screen grid md:grid-cols-2">
      <div className="hidden md:flex flex-col justify-between p-10" style={{ background: "linear-gradient(135deg,#0d1b3e 0%,#1d3f8a 100%)" }}>
        <div className="flex items-center gap-2.5"><div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center"><BarChart3 size={15} className="text-white" /></div><span className="font-bold text-white">SpareTrack</span></div>
        <div>
          <div className="text-4xl font-bold text-white mb-4 leading-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Stok Terkontrol,<br />Bisnis Lancar.</div>
          <p className="text-blue-200 text-sm leading-relaxed mb-8">Sistem manajemen inventori sparepart bengkel multi-cabang.</p>
          <div className="grid grid-cols-2 gap-4">
            {[["485","Total Stok"],["3","Cabang Aktif"],["91.2%","Akurasi SMA"],["Rp 183M","Nilai Inv."]].map(([v, l]) => (
              <div key={l} className="p-3 rounded-xl border border-white/10 bg-white/5"><div className="font-bold text-white text-lg" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{v}</div><div className="text-xs text-blue-300">{l}</div></div>
            ))}
          </div>
        </div>
        <div className="text-xs text-blue-300/60">© 2025 SpareTrack · Multi-Branch Inventory</div>
      </div>
      <div className="flex items-center justify-center p-8 bg-slate-50 dark:bg-slate-950">
        <div className="w-full max-w-sm">
          <div className="md:hidden flex items-center gap-2 mb-8"><div className="w-8 h-8 rounded-lg bg-blue-700 flex items-center justify-center"><BarChart3 size={15} className="text-white" /></div><span className="font-bold text-slate-800">SpareTrack</span></div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Selamat datang!</h2>
          <p className="text-sm text-slate-400 mb-6">Masuk ke akun SpareTrack Anda</p>
          <div className="space-y-4">
            <FormField label="Email" required>
              <div className="relative"><Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="admin@sparetrack.id" className={`${inputCls} pl-9`} /></div>
            </FormField>
            <FormField label="Password" required>
              <div className="relative">
                <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input value={password} onChange={e => setPassword(e.target.value)} type={showPass ? "text" : "password"} placeholder="••••••••" className={`${inputCls} pl-9 pr-10`} onKeyDown={e => e.key === "Enter" && login()} />
                <button onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"><Eye size={14} /></button>
              </div>
            </FormField>
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} className="rounded" /><span className="text-slate-600 dark:text-slate-400">Ingat saya</span></label>
              <button onClick={onForgot} className="text-blue-600 hover:underline text-xs">Lupa password?</button>
            </div>
            <button onClick={login} disabled={loading} className="w-full flex items-center justify-center gap-2 py-3 text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 active:scale-95 rounded-xl transition-all disabled:opacity-70">
              {loading ? <><Loader2 size={15} className="animate-spin" />Masuk...</> : "Masuk ke Dashboard"}
            </button>
            <div className="relative my-2"><div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200 dark:border-slate-700" /></div><div className="relative flex justify-center"><span className="px-2 bg-slate-50 dark:bg-slate-950 text-xs text-slate-400">atau</span></div></div>
            <button onClick={() => toast.info("Google OAuth belum diaktifkan pada mode demo")} className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 active:scale-95 rounded-xl transition-all"><Globe size={15} className="text-slate-500" />Lanjutkan dengan Google</button>
          </div>
          <p className="text-center text-sm text-slate-500 mt-5">Belum punya akun? <button onClick={onRegister} className="text-blue-600 font-medium hover:underline">Daftar sekarang</button></p>
          <div className="mt-5 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800 text-center text-xs text-blue-700 dark:text-blue-400"><strong>Demo:</strong> Klik Masuk untuk langsung masuk ke dashboard</div>
        </div>
      </div>
    </div>
  );
}

import { BarChart3, Play, ArrowRight, Building2, BarChart2, Zap, Shield, Activity, PieChart } from "lucide-react";

const features = [
  { icon: Building2, title: "Multi-Cabang",        desc: "Pantau stok seluruh cabang dari satu dashboard terpusat secara real-time." },
  { icon: BarChart2, title: "Demand Forecasting",  desc: "Prediksi kebutuhan sparepart menggunakan model SMA berbasis histori penjualan." },
  { icon: Zap,       title: "Restock Otomatis",    desc: "Rekomendasi restock cerdas berdasarkan safety stock dan reorder point." },
  { icon: Shield,    title: "Role-Based Access",   desc: "Kontrol akses berbasis peran untuk Admin Pusat dan Admin Cabang." },
  { icon: Activity,  title: "Real-time Monitoring",desc: "Lacak pergerakan stok masuk, keluar, dan transfer antar cabang secara langsung." },
  { icon: PieChart,  title: "Laporan Mendalam",    desc: "Ekspor laporan stok, penjualan, dan forecasting dalam format PDF maupun Excel." },
];

export function LandingPage({ onLogin }: { onLogin: () => void }) {
  return (
    <div className="min-h-screen text-white overflow-x-hidden" style={{ background: "#080f23" }}>
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5" style={{ background: "rgba(8,15,35,0.92)", backdropFilter: "blur(12px)" }}>
        <div className="max-w-6xl mx-auto px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5"><div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center"><BarChart3 size={15} className="text-white" /></div><span className="font-bold text-white">SpareTrack</span></div>
          <div className="hidden md:flex items-center gap-6 text-sm text-slate-400">
            {["Fitur","Harga","Tentang","Kontak"].map(l => <a key={l} href="#" className="hover:text-white transition">{l}</a>)}
          </div>
          <div className="flex items-center gap-3">
            <button onClick={onLogin} className="px-4 py-1.5 text-sm text-slate-300 hover:text-white transition">Masuk</button>
            <button onClick={onLogin} className="px-4 py-1.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition active:scale-95">Mulai Gratis</button>
          </div>
        </div>
      </nav>
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 mb-6 rounded-full text-xs text-blue-400 border border-blue-500/20" style={{ background: "rgba(59,130,246,0.1)" }}>
            <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" />Sistem Manajemen Stok Bengkel Modern
          </div>
          <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-5" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Kendali Penuh Stok<br />
            <span style={{ background: "linear-gradient(135deg,#60a5fa,#34d399)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Sparepart Bengkel</span>
          </h1>
          <p className="text-lg text-slate-400 max-w-xl mx-auto mb-8 leading-relaxed">Platform manajemen inventori multi-cabang dengan prediksi demand SMA, rekomendasi restock otomatis, dan monitoring stok real-time.</p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <button onClick={onLogin} className="flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-xl transition-all shadow-lg shadow-blue-900/40 active:scale-95"><Play size={14} />Mulai Sekarang</button>
            <button onClick={onLogin} className="flex items-center gap-2 px-6 py-3 text-sm font-medium text-slate-300 hover:text-white border border-white/10 hover:border-white/20 rounded-xl transition-all">Lihat Demo<ArrowRight size={14} /></button>
          </div>
        </div>
        <div className="max-w-5xl mx-auto mt-16 relative">
          <div className="absolute inset-0 pointer-events-none z-10" style={{ background: "linear-gradient(to top, #080f23 0%, transparent 40%)" }} />
          <div className="rounded-2xl border border-white/10 overflow-hidden shadow-2xl shadow-blue-900/20" style={{ background: "rgba(13,27,62,0.8)" }}>
            <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5">
              <div className="w-3 h-3 rounded-full bg-red-500/60" /><div className="w-3 h-3 rounded-full bg-amber-500/60" /><div className="w-3 h-3 rounded-full bg-emerald-500/60" />
              <span className="ml-3 px-3 py-0.5 text-xs text-slate-400 bg-white/5 rounded" style={{ fontFamily: "'JetBrains Mono', monospace" }}>app.sparetrack.id/dashboard</span>
            </div>
            <div className="p-5 grid grid-cols-4 gap-3">
              {[["485","Total Stok"],["3","Item Kritis"],["Rp 183M","Nilai Inv."],["91.2%","Akurasi"]].map(([v, l]) => (
                <div key={l} className="bg-white/5 rounded-xl p-3 border border-white/5">
                  <div className="text-lg font-bold text-white mb-0.5" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{v}</div>
                  <div className="text-xs text-slate-500">{l}</div>
                </div>
              ))}
            </div>
            <div className="px-5 pb-5"><div className="h-24 bg-white/5 rounded-xl border border-white/5 flex items-end justify-center pb-3"><div className="flex gap-0.5 items-end h-14 px-4">{[45,60,40,75,55,85,65,90,70,80,60,95].map((h, i) => <div key={i} className="w-4 rounded-t" style={{ height:`${h}%`, background: i>8?"rgba(96,165,250,0.4)":"rgba(59,130,246,0.6)" }} />)}</div></div></div>
          </div>
        </div>
      </section>
      <section className="py-12 px-6 border-y border-white/5" style={{ background: "rgba(255,255,255,0.02)" }}>
        <div className="max-w-3xl mx-auto grid grid-cols-3 gap-8 text-center">
          {[["3+","Cabang Bengkel"],["1.200+","Item Sparepart"],["99.2%","Uptime Sistem"]].map(([v, l]) => (
            <div key={l}><div className="text-3xl font-bold text-white mb-1">{v}</div><div className="text-sm text-slate-400">{l}</div></div>
          ))}
        </div>
      </section>
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12"><h2 className="text-3xl font-bold mb-3" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Fitur Lengkap untuk Bengkel Modern</h2><p className="text-slate-400">Semua yang Anda butuhkan untuk mengelola stok sparepart secara efisien</p></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {features.map(f => (
              <div key={f.title} className="p-5 rounded-2xl border border-white/8 hover:border-blue-500/30 transition-all group" style={{ background: "rgba(255,255,255,0.03)" }}>
                <div className="w-10 h-10 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center justify-center mb-4 group-hover:bg-blue-500/20 transition"><f.icon size={18} className="text-blue-400" /></div>
                <h3 className="font-semibold text-white mb-2">{f.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="py-20 px-6">
        <div className="max-w-2xl mx-auto text-center p-10 rounded-3xl border border-blue-500/20" style={{ background: "linear-gradient(135deg,rgba(29,78,216,0.15),rgba(8,145,178,0.1))" }}>
          <h2 className="text-3xl font-bold mb-3" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Siap Mengoptimalkan Stok Bengkel?</h2>
          <p className="text-slate-400 mb-6">Bergabung dengan bengkel yang sudah menggunakan SpareTrack</p>
          <button onClick={onLogin} className="px-8 py-3 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-xl transition-all active:scale-95">Mulai Gratis Sekarang</button>
        </div>
      </section>
      <footer className="py-8 px-6 border-t border-white/5 text-center text-xs text-slate-600">© 2025 SpareTrack. All rights reserved.</footer>
    </div>
  );
}

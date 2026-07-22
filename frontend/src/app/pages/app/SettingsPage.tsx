import React, { useState, useEffect, useCallback } from "react";
import {
  Globe, Moon, Bell, Sliders, Shield, Users, History, Info, User, Save,
  Lock, Smartphone, KeyRound, ChevronRight, Plus, Download, BarChart3,
} from "lucide-react";
import { toast } from "sonner";
import { Card } from "../../components/shared/Card";
import { FormField } from "../../components/shared/FormField";
import { Skeleton } from "../../components/shared/Skeleton";
import { EditProfileModal } from "../../components/modals/EditProfileModal";
import { ManageUserModal } from "../../components/modals/ManageUserModal";
import { inputCls } from "../../config";
import { getSettings, updateSettings, type SettingsResponse } from "../../services/settings";
import { getUsers, toggleUserActive } from "../../services/users";
import type { User as UserType } from "../../services/users";

export function SettingsPage({ onEditProfile, darkMode, setDarkMode }: { onEditProfile: () => void; darkMode: boolean; setDarkMode: (v: boolean) => void }) {
  const [tab, setTab] = useState("general");
  const [settingsData, setSettingsData] = useState<SettingsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [notif, setNotif] = useState({ emailKritis: true, emailRestock: true, browser: false, weekly: true });
  const [users, setUsers] = useState<UserType[]>([]);
  const [usersMeta, setUsersMeta] = useState({ page: 1, total: 0, total_pages: 0 });
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersPage, setUsersPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserType | null>(null);

  const loadUsers = useCallback(async (page = 1) => {
    setUsersLoading(true);
    try {
      const res = await getUsers({ page, limit: 20 });
      setUsers(res.data || []);
      if (res.meta) {
        setUsersMeta({
          page: Number(res.meta.page) || 1,
          total: Number(res.meta.total) || 0,
          total_pages: Number(res.meta.total_pages) || 0,
        });
      }
    } catch {
      toast.error("Gagal memuat data pengguna");
    } finally {
      setUsersLoading(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    getSettings()
      .then(setSettingsData)
      .catch(() => toast.error("Gagal memuat pengaturan"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (tab === "pengguna") loadUsers(usersPage);
  }, [tab, usersPage, loadUsers]);

  function Toggle({ val, onChange }: { val: boolean; onChange: (v: boolean) => void }) {
    return <button onClick={() => onChange(!val)} className={`relative w-10 h-5 rounded-full transition-colors ${val?"bg-blue-600":"bg-slate-300 dark:bg-slate-600"}`}><div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${val?"translate-x-5":""}`} /></button>;
  }
  function Row({ label, sub, right }: { label: string; sub?: string; right: React.ReactNode }) {
    return <div className="flex items-center justify-between py-3 border-b border-slate-100 dark:border-slate-800 last:border-0"><div><div className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</div>{sub&&<div className="text-xs text-slate-400 mt-0.5">{sub}</div>}</div>{right}</div>;
  }

  const tabs = [
    { id:"general",     label:"General",         icon:Globe        },
    { id:"appearance",  label:"Appearance",      icon:Moon         },
    { id:"notifikasi",  label:"Notifikasi",      icon:Bell         },
    { id:"parameter",   label:"Parameter Stok",  icon:Sliders      },
    { id:"keamanan",    label:"Keamanan",        icon:Shield       },
    { id:"pengguna",    label:"Pengguna",        icon:Users        },
    { id:"audit",       label:"Audit Log",       icon:History      },
    { id:"about",       label:"Tentang",         icon:Info         },
  ];

  if (loading) {
    return <div className="flex gap-5"><div className="w-44 shrink-0"><Skeleton className="h-80" /></div><div className="flex-1"><Skeleton className="h-96" /></div></div>;
  }

  const p = settingsData?.profile;
  const s = settingsData?.settings as Record<string, string> | undefined;

  return (
    <div className="flex gap-5">
      <div className="w-44 shrink-0">
        <Card className="p-2">
          {tabs.map(t => <button key={t.id} onClick={() => setTab(t.id)} className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-all ${tab===t.id?"bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 font-semibold":"text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"}`}><t.icon size={14} />{t.label}</button>)}
        </Card>
      </div>
      <div className="flex-1 min-w-0">
        {tab === "general" && (
          <Card className="p-6">
            <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-5">Pengaturan Umum</h3>
            <div className="flex items-center gap-4 mb-6 pb-5 border-b border-slate-100 dark:border-slate-800">
              <div className="w-14 h-14 rounded-full bg-blue-700 flex items-center justify-center text-xl font-bold text-white">{p?.full_name?.[0] || 'A'}</div>
              <div><div className="font-semibold text-slate-800 dark:text-slate-200">{p?.full_name || '-'}</div><div className="text-xs text-slate-400">{p?.email} · {p?.role === 'super_admin' ? 'Super Admin' : p?.role || '-'}</div></div>
              <button onClick={onEditProfile} className="ml-auto flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-blue-700 hover:bg-blue-800 active:scale-95 rounded-lg transition-all shadow-sm"><User size={13} />Edit Profil</button>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              {[["Nama", p?.full_name || '-'],["Email", p?.email || '-'],["Role", p?.role === 'super_admin' ? 'Super Admin' : p?.role || '-'],["No. HP", p?.phone || '-'],["Cabang", p?.branch || '-'],["ID", p?.id?.slice(0,12) || '-']].map(([l, v]) => (
                <div key={l}><div className="text-xs text-slate-400 mb-0.5">{l}</div><div className="font-medium text-slate-700 dark:text-slate-300">{v}</div></div>
              ))}
            </div>
          </Card>
        )}
        {tab === "appearance" && (
          <Card className="p-6">
            <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-5">Tampilan</h3>
            <Row label="Mode Gelap" sub="Aktifkan dark mode untuk kenyamanan" right={<Toggle val={darkMode} onChange={setDarkMode} />} />
            <Row label="Bahasa" sub="Pilih bahasa antarmuka" right={<select className="px-2 py-1.5 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 outline-none"><option>Bahasa Indonesia</option><option>English</option></select>} />
            <Row label="Zona Waktu" sub="Zona waktu yang digunakan" right={<select className="px-2 py-1.5 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 outline-none"><option>WIB (UTC+7)</option><option>WITA (UTC+8)</option><option>WIT (UTC+9)</option></select>} />
          </Card>
        )}
        {tab === "notifikasi" && (
          <Card className="p-6">
            <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-5">Notifikasi</h3>
            <Row label="Email — Stok Kritis"  sub="Kirim email saat stok di bawah safety stock"  right={<Toggle val={notif.emailKritis}  onChange={v => setNotif(n=>({...n,emailKritis:v}))}  />} />
            <Row label="Email — Restock"      sub="Notifikasi saat mencapai reorder point"        right={<Toggle val={notif.emailRestock} onChange={v => setNotif(n=>({...n,emailRestock:v}))} />} />
            <Row label="Notifikasi Browser"   sub="Push notification di browser"                  right={<Toggle val={notif.browser}      onChange={v => setNotif(n=>({...n,browser:v}))}      />} />
            <Row label="Ringkasan Mingguan"   sub="Laporan performa tiap Senin pagi"               right={<Toggle val={notif.weekly}       onChange={v => setNotif(n=>({...n,weekly:v}))}       />} />
            <button onClick={() => toast.success("Pengaturan notifikasi disimpan")} className="mt-5 flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-blue-700 hover:bg-blue-800 active:scale-95 rounded-lg transition-all shadow-sm"><Save size={13} />Simpan</button>
          </Card>
        )}
        {tab === "parameter" && (
          <Card className="p-6">
            <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-1">Parameter Sistem Stok</h3>
            <p className="text-xs text-slate-400 mb-5">Konfigurasi kalkulasi reorder dan prediksi SMA</p>
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800 mb-5">
              <div className="flex items-center gap-2 mb-3"><span className="text-xs font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider">Model Forecasting</span><span className="text-xs px-2 py-0.5 bg-blue-700 text-white rounded-full font-semibold">SMA Aktif</span></div>
              <FormField label="Periode SMA (bulan)"><div className="flex items-center gap-3"><input defaultValue={s?.['sma_period'] || '3'} type="number" min="1" max="12" className="w-20 px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg outline-none focus:border-blue-500 bg-white dark:bg-slate-800 dark:text-slate-200 text-center" /><span className="text-xs text-slate-500">bulan data historis</span></div></FormField>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[["default_min_stock", s?.['default_min_stock'] || '10', "unit"],["safety_stock_multiplier", s?.['safety_stock_multiplier'] || '1.5', "×"],["reorder_point_multiplier", s?.['reorder_point_multiplier'] || '2.0', "×"],["buffer_lead_time", s?.['buffer_lead_time'] || '20', "%"]].map(([key, val, unit]) => (
                <FormField key={key} label={key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}><div className="flex items-center gap-2"><input defaultValue={val} type="number" step="0.1" className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg outline-none focus:border-blue-500 bg-white dark:bg-slate-800 dark:text-slate-200" /><span className="text-xs text-slate-400 shrink-0">{unit}</span></div></FormField>
              ))}
            </div>
            <button onClick={async () => {
              const btn = document.activeElement as HTMLButtonElement;
              try {
                const period = (document.querySelector('#param_sma') as HTMLInputElement)?.value || '3';
                await updateSettings({ key: 'sma_period', value: Number(period) });
                toast.success("Parameter sistem diperbarui");
              } catch { toast.error("Gagal menyimpan parameter"); }
            }} className="mt-5 flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-blue-700 hover:bg-blue-800 active:scale-95 rounded-lg transition-all shadow-sm"><Save size={13} />Simpan Parameter</button>
          </Card>
        )}
        {tab === "keamanan" && (
          <Card className="p-6">
            <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-5">Keamanan Akun</h3>
            <div className="space-y-3">
              {[{ icon:Lock,       title:"Ubah Password",   desc:"Perbarui password secara berkala" },
                { icon:Smartphone, title:"Autentikasi 2FA", desc:"Tambah lapisan keamanan dengan OTP (coming soon)" },
                { icon:History,    title:"Riwayat Login",   desc:"Lihat aktivitas login terbaru" },
                { icon:KeyRound,   title:"API Token",       desc:"Kelola token akses untuk integrasi" }].map(s => (
                <div key={s.title} className="flex items-center gap-4 p-4 border border-slate-100 dark:border-slate-800 rounded-xl hover:border-blue-200 dark:hover:border-blue-700 transition-colors cursor-pointer" onClick={() => toast.info(`${s.title} dibuka`)}>
                  <div className="w-9 h-9 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center shrink-0"><s.icon size={15} className="text-blue-600" /></div>
                  <div className="flex-1 min-w-0"><div className="text-sm font-semibold text-slate-700 dark:text-slate-300">{s.title}</div><div className="text-xs text-slate-400">{s.desc}</div></div>
                  <ChevronRight size={14} className="text-slate-400" />
                </div>
              ))}
            </div>
            {settingsData?.api_tokens && settingsData.api_tokens.length > 0 && (
              <div className="mt-5">
                <div className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">API Token Aktif</div>
                <div className="space-y-2">
                  {settingsData.api_tokens.filter(t => t.is_active).map(t => (
                    <div key={t.id} className="flex items-center justify-between p-3 border border-slate-100 dark:border-slate-800 rounded-lg">
                      <div><div className="text-sm font-medium text-slate-700 dark:text-slate-300">{t.name}</div><div className="text-xs text-slate-400">Dibuat {new Date(t.created_at).toLocaleDateString('id-ID')}</div></div>
                      <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-500" /><span className="text-xs font-medium text-emerald-600">Aktif</span></div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        )}
        {tab === "pengguna" && (
          <Card className="p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-slate-800 dark:text-slate-200">Manajemen Pengguna</h3>
              <button onClick={() => { setEditingUser(null); setModalOpen(true); }} className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-blue-700 hover:bg-blue-800 active:scale-95 rounded-lg transition-all shadow-sm"><Plus size={13} />Tambah User</button>
            </div>
            {usersLoading ? (
              <div className="space-y-3">{Array.from({length:5}).map((_,i)=><Skeleton key={i} className="h-12" />)}</div>
            ) : users.length === 0 ? (
              <div className="text-center py-10 text-sm text-slate-400">Belum ada pengguna</div>
            ) : (
              <table className="w-full text-sm">
                <thead><tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">{["Nama","Email","Role","Cabang","Status",""].map(h => <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500">{h}</th>)}</tr></thead>
                <tbody>{users.map(u => (
                  <tr key={u.id} className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/30">
                    <td className="px-4 py-3"><div className="flex items-center gap-2"><div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 flex items-center justify-center text-xs font-bold">{u.full_name[0]}</div><span className="font-medium text-slate-700 dark:text-slate-300">{u.full_name}</span></div></td>
                    <td className="px-4 py-3 text-xs text-slate-400">{u.email}</td>
                    <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-400">{u.role === 'super_admin' ? 'Super Admin' : 'Admin Cabang'}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{u.branch || 'Semua'}</td>
                    <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${u.is_active ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700" : "bg-slate-100 dark:bg-slate-700 text-slate-500"}`}>{u.is_active ? 'Aktif' : 'Nonaktif'}</span></td>
                    <td className="px-4 py-3 flex items-center gap-2">
                      <button onClick={() => { setEditingUser(u); setModalOpen(true); }} className="text-xs text-blue-600 hover:underline">Edit</button>
                      <button onClick={async () => {
                        try {
                          await toggleUserActive(u.id);
                          toast.success(u.is_active ? 'User dinonaktifkan' : 'User diaktifkan');
                          loadUsers(usersPage);
                        } catch { toast.error('Gagal mengubah status user'); }
                      }} className={`text-xs hover:underline ${u.is_active ? 'text-red-500' : 'text-emerald-600'}`}>{u.is_active ? 'Nonaktifkan' : 'Aktifkan'}</button>
                    </td>
                  </tr>
                ))}</tbody>
              </table>
            )}
            {usersMeta.total_pages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                <span className="text-xs text-slate-400">Total {usersMeta.total} pengguna</span>
                <div className="flex items-center gap-2">
                  <button onClick={() => setUsersPage(p => Math.max(1, p-1))} disabled={usersPage <= 1} className="px-3 py-1 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-30">Prev</button>
                  <span className="text-xs text-slate-500">{usersPage} / {usersMeta.total_pages}</span>
                  <button onClick={() => setUsersPage(p => Math.min(usersMeta.total_pages, p+1))} disabled={usersPage >= usersMeta.total_pages} className="px-3 py-1 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-30">Next</button>
                </div>
              </div>
            )}
          </Card>
        )}
        <ManageUserModal open={modalOpen} onClose={() => setModalOpen(false)} onSaved={() => loadUsers(usersPage)} user={editingUser} />
        {tab === "audit" && (
          <Card className="p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-slate-800 dark:text-slate-200">Audit Log</h3>
              <button onClick={() => toast.success("Audit log diekspor")} className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 active:scale-95 rounded-lg transition-all"><Download size={13} />Export</button>
            </div>
            <div className="space-y-3">
              {[
                { user:"Admin Pusat", action:"Menambah sparepart baru: Timing Belt Kit",      time:"06 Jul 2025 14:32", module:"Inventory",    ip:"192.168.1.1" },
                { user:"Admin B",     action:"Mencatat stok keluar: Kampas Rem ×5",           time:"06 Jul 2025 13:15", module:"Transactions", ip:"192.168.1.2" },
                { user:"Admin Pusat", action:"Menyetujui PO #045 untuk Gates",               time:"05 Jul 2025 10:40", module:"Restock",      ip:"192.168.1.1" },
                { user:"Admin A",     action:"Transfer 10× Busi NGK ke Cabang C",            time:"05 Jul 2025 09:20", module:"Transactions", ip:"192.168.1.3" },
              ].map((log, i) => (
                <div key={i} className="flex gap-4 p-3 border border-slate-100 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                  <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 text-xs font-bold flex items-center justify-center shrink-0">{log.user[0]}</div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">{log.user}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{log.action}</div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-400"><span>{log.time}</span><span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 rounded">{log.module}</span><span style={{ fontFamily:"'JetBrains Mono', monospace" }}>{log.ip}</span></div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
        {tab === "about" && (
          <Card className="p-6 text-center">
            <div className="w-14 h-14 bg-blue-700 rounded-2xl flex items-center justify-center mx-auto mb-4"><BarChart3 size={24} className="text-white" /></div>
            <h3 className="font-bold text-slate-800 dark:text-slate-200 text-xl mb-1" style={{ fontFamily:"'Plus Jakarta Sans', sans-serif" }}>SpareTrack</h3>
            <div className="text-xs text-blue-600 font-semibold mb-2">Multi-Branch Spare Parts Management System</div>
            <div className="text-sm text-slate-500 mb-5">Versi 2.0.0 · React + TypeScript</div>
            <div className="grid grid-cols-3 gap-4 text-center mb-5">
              {[["485","Total Stok"],["3","Cabang"],["91.2%","Akurasi SMA"]].map(([v, l]) => <div key={l}><div className="font-bold text-slate-700 dark:text-slate-300">{v}</div><div className="text-xs text-slate-400">{l}</div></div>)}
            </div>
            <p className="text-xs text-slate-400">© 2025 SpareTrack. All rights reserved.</p>
          </Card>
        )}
      </div>
    </div>
  );
}

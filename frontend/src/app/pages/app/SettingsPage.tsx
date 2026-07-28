import React, { useState, useEffect, useCallback } from "react";
import {
  Globe, Shield, Users, History, Info, User, Save,
  Lock, ChevronRight, Plus, BarChart3, Loader2,
  HelpCircle, ChevronDown, Eye, EyeOff, ShieldAlert, CheckCircle2,
} from "lucide-react";
import * as Lucide from "lucide-react";
import { toast } from "sonner";
import { Card } from "../../components/shared/Card";
import { FormField } from "../../components/shared/FormField";
import { Skeleton } from "../../components/shared/Skeleton";
import { EditProfileModal } from "../../components/modals/EditProfileModal";
import { ManageUserModal } from "../../components/modals/ManageUserModal";
import { ForgotPasswordModal } from "../../components/modals/ForgotPasswordModal";
import { inputCls } from "../../config";
import { supabase } from "../../services/supabase";
import { getLoginHistory, type LoginHistoryEntry } from "../../services/loginHistory";
import { getSettings, updateSettings, type SettingsResponse } from "../../services/settings";
import { getUsers } from "../../services/users";
import type { User as UserType } from "../../services/users";
import { getAuditLogs, type AuditLogEntry } from "../../services/auditLog";
import { helpSegments, helpFileUrl } from "../../data/help";
import { MarkdownRenderer } from "../../components/help/MarkdownRenderer";

export function SettingsPage({ onEditProfile, currentRole }: { onEditProfile: () => void; currentRole?: string }) {
  const [tab, setTab] = useState("general");
  const [settingsData, setSettingsData] = useState<SettingsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserType[]>([]);
  const [usersMeta, setUsersMeta] = useState({ page: 1, total: 0, total_pages: 0 });
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersPage, setUsersPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserType | null>(null);

  const [helpContent, setHelpContent] = useState<Record<string, string>>({});
  const [helpLoading, setHelpLoading] = useState(false);
  const [expandedSeg, setExpandedSeg] = useState<Record<string, boolean>>({});
  const [expandedQ, setExpandedQ] = useState<Record<string, boolean>>({});

  const [currentPass, setCurrentPass] = useState("");
  const [passVerified, setPassVerified] = useState(false);
  const [verifyingPass, setVerifyingPass] = useState(false);
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [savingPass, setSavingPass] = useState(false);
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [forgotPwOpen, setForgotPwOpen] = useState(false);
  const [isGoogle, setIsGoogle] = useState<boolean | null>(null);
  const [sessionEmail, setSessionEmail] = useState("");
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [showLoginHistory, setShowLoginHistory] = useState(false);
  const [loginHistory, setLoginHistory] = useState<LoginHistoryEntry[]>([]);
  const [loginHistoryLoading, setLoginHistoryLoading] = useState(false);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  useEffect(() => {
    if (tab === "keamanan") {
      supabase.auth.getUser().then(({ data }) => {
        const u = data?.user;
        const providers: string[] = u?.app_metadata?.providers || u?.identities?.map(i => i.provider) || [];
        setIsGoogle(providers.includes("google"));
        setSessionEmail(u?.email ?? "");
      });
    }
  }, [tab]);

  async function verifyCurrentPassword() {
    if (!sessionEmail) return;
    setVerifyingPass(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email: sessionEmail, password: currentPass });
      if (error) { toast.error("Password saat ini tidak sesuai"); return; }
      setPassVerified(true);
      toast.success("Password saat ini sesuai");
    } finally {
      setVerifyingPass(false);
    }
  }

  async function handleSavePassword() {
    if (!newPass) { toast.error("Masukkan password baru"); return; }
    if (newPass.length < 6) { toast.error("Password minimal 6 karakter"); return; }
    if (!confirmPass) { toast.error("Konfirmasi password wajib diisi"); return; }
    if (newPass !== confirmPass) { toast.error("Konfirmasi password tidak cocok"); return; }
    setSavingPass(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPass });
      if (error) throw error;
      toast.success("Password berhasil diperbarui");
      setCurrentPass(""); setNewPass(""); setConfirmPass(""); setPassVerified(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal mengubah password");
    } finally {
      setSavingPass(false);
    }
  }

  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [auditLogsMeta, setAuditLogsMeta] = useState({ page: 1, total: 0, total_pages: 0 });
  const [auditLogsLoading, setAuditLogsLoading] = useState(false);
  const [auditLogsPage, setAuditLogsPage] = useState(1);
  const [auditFilterAction, setAuditFilterAction] = useState("");
  const [auditFilterStartDate, setAuditFilterStartDate] = useState("");
  const [auditFilterEndDate, setAuditFilterEndDate] = useState("");
  const [auditFilterSearch, setAuditFilterSearch] = useState("");
  const [selectedAuditLog, setSelectedAuditLog] = useState<AuditLogEntry | null>(null);

  const loadAuditLogs = useCallback(async (page = 1, filters = {}) => {
    setAuditLogsLoading(true);
    try {
      const res = await getAuditLogs({
        page,
        limit: 15,
        action: auditFilterAction || undefined,
        start_date: auditFilterStartDate || undefined,
        end_date: auditFilterEndDate || undefined,
        search: auditFilterSearch || undefined,
        ...filters,
      });
      setAuditLogs(res.data || []);
      if (res.meta) {
        setAuditLogsMeta({
          page: Number(res.meta.page) || 1,
          total: Number(res.meta.total) || 0,
          total_pages: Number(res.meta.total_pages) || 0,
        });
      }
    } catch {
      toast.error("Gagal memuat audit log");
    } finally {
      setAuditLogsLoading(false);
    }
  }, [auditFilterAction, auditFilterStartDate, auditFilterEndDate, auditFilterSearch]);

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

  useEffect(() => {
    if (tab === "audit") loadAuditLogs(auditLogsPage);
  }, [tab, auditLogsPage, loadAuditLogs]);

  useEffect(() => {
    if (tab !== "bantuan" || helpLoading) return;
    const unloaded = helpSegments.filter(s => !helpContent[s.file]);
    if (unloaded.length === 0) return;
    setHelpLoading(true);
    Promise.all(unloaded.map(async seg => {
      try {
        const res = await fetch(helpFileUrl(seg.file));
        const text = await res.text();
        return { file: seg.file, content: text };
      } catch { return null; }
    })).then(results => {
      const entries = results.filter(Boolean) as { file: string; content: string }[];
      if (entries.length > 0) {
        setHelpContent(prev => ({ ...prev, ...Object.fromEntries(entries.map(e => [e.file, e.content])) }));
      }
    }).finally(() => setHelpLoading(false));
  }, [tab, helpContent, helpLoading]);

  const isSuperAdmin = currentRole === "super_admin";
  const tabs = [
    { id:"general",     label:"General",         icon:Globe        },
    { id:"bantuan",     label:"Bantuan",         icon:HelpCircle   },
    { id:"keamanan",    label:"Keamanan",        icon:Shield       },
    ...(isSuperAdmin ? [{ id:"pengguna", label:"Pengguna", icon:Users }] : []),
    ...(isSuperAdmin ? [{ id:"audit", label:"Audit Log", icon:History }] : []),
    { id:"about",       label:"Tentang",         icon:Info         },
  ];

  if (loading) {
    return <div className="flex gap-5"><div className="w-44 shrink-0"><Skeleton className="h-80" /></div><div className="flex-1"><Skeleton className="h-96" /></div></div>;
  }

  const p = settingsData?.profile;
  const s = settingsData?.settings as Record<string, string> | undefined;

  return (<>
    <div className="flex flex-col md:flex-row gap-5">
      {/* Mobile tabs */}
      <div className="md:hidden overflow-x-auto flex gap-1 pb-1 -mx-1 px-1">
        {tabs.map(t => <button key={t.id} onClick={() => setTab(t.id)} className={`shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs transition-all ${tab===t.id?"bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 font-semibold":"text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"}`}><t.icon size={13} />{t.label}</button>)}
      </div>
      {/* Desktop sidebar */}
      <div className="hidden md:block w-44 shrink-0">
        <Card className="p-2">
          {tabs.map(t => <button key={t.id} onClick={() => setTab(t.id)} className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-all ${tab===t.id?"bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 font-semibold":"text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"}`}><t.icon size={14} />{t.label}</button>)}
        </Card>
      </div>
      <div className="flex-1 min-w-0">
        {tab === "general" && (
          <Card className="p-4 sm:p-6">
            <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-5">Pengaturan Umum</h3>
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mb-6 pb-5 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-14 h-14 rounded-full bg-blue-700 flex items-center justify-center text-xl font-bold text-white shrink-0">{p?.full_name?.[0] || 'A'}</div>
                <div className="min-w-0"><div className="font-semibold text-slate-800 dark:text-slate-200 truncate">{p?.full_name || '-'}</div><div className="text-xs text-slate-400 truncate">{p?.email} · {p?.role === 'super_admin' ? 'Super Admin' : p?.role || '-'}</div></div>
              </div>
              <button onClick={onEditProfile} className="flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-blue-700 hover:bg-blue-800 active:scale-95 rounded-lg transition-all shadow-sm sm:self-center"><User size={13} />Edit Profil</button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 gap-y-5 text-sm">
              {[["Nama", p?.full_name || '-'],["Email", p?.email || '-'],["Role", p?.role === 'super_admin' ? 'Super Admin' : p?.role || '-'],["No. HP", p?.phone || '-'],["Cabang", p?.branch || '-'],["ID", p?.id?.slice(0,12) || '-']].map(([l, v]) => (
                <div key={l} className="min-w-0"><div className="text-xs text-slate-400 mb-0.5">{l}</div><div className="font-medium text-slate-700 dark:text-slate-300 truncate">{v}</div></div>
              ))}
            </div>
          </Card>
        )}

        {tab === "bantuan" && (
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center"><HelpCircle size={20} className="text-blue-600" /></div>
              <div><h3 className="font-bold text-slate-800 dark:text-slate-200">Pusat Bantuan</h3><p className="text-xs text-slate-400">Panduan lengkap penggunaan sistem SpareTrack</p></div>
            </div>
            <div className="space-y-3">
              {helpSegments.map(seg => {
                const Icon = Lucide[seg.icon as keyof typeof Lucide] as React.ComponentType<{ size?: number; className?: string }>;
                const content = helpContent[seg.file];
                const isSegOpen = expandedSeg[seg.file] ?? false;
                return (
                  <div key={seg.file} className="border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden">
                    <button onClick={() => setExpandedSeg(prev => ({...prev, [seg.file]: !isSegOpen}))} className="w-full flex items-center gap-3 px-4 py-3.5 bg-slate-50/50 dark:bg-slate-800/30 hover:bg-slate-100 dark:hover:bg-slate-700/40 transition-colors">
                      <div className="w-8 h-8 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center shrink-0"><Icon size={16} className="text-blue-600" /></div>
                      <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex-1 text-left">{seg.title}</span>
                      <ChevronDown size={15} className={`text-slate-400 transition-transform duration-200 ${isSegOpen ? 'rotate-180' : ''}`} />
                    </button>
                    <div className={`overflow-hidden transition-all duration-200 ${isSegOpen ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                      <div className="border-t border-slate-100 dark:border-slate-800">
                        {!content ? (
                          <div className="flex items-center gap-2 px-4 py-3">
                            <div className="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                            <span className="text-xs text-slate-400">Memuat...</span>
                          </div>
                        ) : (() => {
                          const sections = content.split(/^## /m).filter(Boolean).map(s => {
                            const idx = s.indexOf('\n');
                            const heading = idx >= 0 ? s.slice(0, idx).trim() : s.trim();
                            const body = idx >= 0 ? s.slice(idx + 1).replace(/^---\s*$/gm, '').trim() : '';
                            return { heading, body };
                          }).filter(s => s.heading);
                          return (
                            <div className="divide-y divide-slate-50 dark:divide-slate-800/50">
                              {sections.map((section, idx) => {
                                const qKey = `${seg.file}-${idx}`;
                                const isQOpen = expandedQ[qKey] ?? false;
                                return (
                                  <div key={qKey}>
                                    <button onClick={() => setExpandedQ(prev => ({...prev, [qKey]: !isQOpen}))} className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${isQOpen ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-slate-300 dark:border-slate-600'}`}>
                                        <span className={`text-[10px] font-bold transition-colors ${isQOpen ? 'text-blue-600' : 'text-slate-400'}`}>{isQOpen ? '−' : '+'}</span>
                                      </div>
                                      <span className="text-xs text-slate-700 dark:text-slate-300 flex-1 font-medium">{section.heading}</span>
                                    </button>
                                    <div className={`overflow-hidden transition-all duration-200 ${isQOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                                      <MarkdownRenderer content={section.body} />
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        )}
        {tab === "keamanan" && (
          <Card className="p-4 sm:p-6">
            <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-5">Keamanan Akun</h3>

            {showLoginHistory ? (
              <>
                <button onClick={() => { setShowLoginHistory(false); setLoginHistory([]); }} className="flex items-center gap-1.5 text-xs text-blue-600 hover:underline mb-4">&larr; Kembali ke menu utama</button>
                {loginHistoryLoading ? (
                  <div className="space-y-3">{Array.from({length:5}).map((_,i)=><Skeleton key={i} className="h-12" />)}</div>
                ) : loginHistory.length === 0 ? (
                  <div className="text-center py-10 text-sm text-slate-400">Belum ada riwayat login</div>
                ) : (
                  <div className="space-y-2">
                    {loginHistory.map(h => {
                      const isOpen = expandedLogId === h.id;
                      return (
                        <div key={h.id} className="border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden">
                          <button onClick={() => setExpandedLogId(isOpen ? null : h.id)} className="w-full flex items-center gap-4 p-4 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors text-left">
                            <div className="w-9 h-9 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center shrink-0">
                              <div className={`w-2.5 h-2.5 rounded-full ${h.logout_at ? 'bg-slate-300 dark:bg-slate-600' : 'bg-green-500'}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                {new Date(h.login_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                              </div>
                              <div className="text-xs text-slate-400">
                                {h.ip_address || 'IP tidak tercatat'}
                                {!h.logout_at && <span className="text-green-500 font-medium"> &middot; Aktif</span>}
                              </div>
                            </div>
                            <ChevronDown size={14} className={`text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                          </button>
                          <div className={`overflow-hidden transition-all duration-200 ${isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                            <div className="px-4 pb-4 pt-0 border-t border-slate-100 dark:border-slate-800 mx-4 space-y-2.5">
                              <div className="grid grid-cols-[100px_1fr] gap-x-3 gap-y-2 text-xs pt-3">
                                <span className="text-slate-400">Waktu Login</span>
                                <span className="text-slate-700 dark:text-slate-300 font-medium">{new Date(h.login_at).toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'medium' })}</span>
                                <span className="text-slate-400">Waktu Logout</span>
                                <span className="text-slate-700 dark:text-slate-300 font-medium">{h.logout_at ? new Date(h.logout_at).toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'medium' }) : <span className="text-green-500">Masih aktif</span>}</span>
                                <span className="text-slate-400">IP Address</span>
                                <span className="text-slate-700 dark:text-slate-300 font-medium" style={{ fontFamily:"'JetBrains Mono', monospace" }}>{h.ip_address || '-'}</span>
                                <span className="text-slate-400">User Agent</span>
                                <span className="text-slate-700 dark:text-slate-300 font-medium text-[11px] break-all leading-relaxed">{h.user_agent || '-'}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            ) : showPasswordSection ? (
              <>
                <button onClick={() => { setShowPasswordSection(false); setCurrentPass(""); setNewPass(""); setConfirmPass(""); setPassVerified(false); }} className="flex items-center gap-1.5 text-xs text-blue-600 hover:underline mb-4">&larr; Kembali ke menu utama</button>
                <div className="space-y-5">
                  <FormField label="Password Saat Ini">
                    <div className="relative">
                      <input value={currentPass} onChange={e => { setCurrentPass(e.target.value); setPassVerified(false); }}
                        type={showCurrentPass ? "text" : "password"} placeholder="Masukkan password saat ini"
                        className={`${inputCls} pr-9`}
                        onBlur={() => { if (currentPass && sessionEmail) verifyCurrentPassword(); }}
                        onKeyDown={e => { if (e.key==="Enter" && currentPass && sessionEmail) verifyCurrentPassword(); }} />
                      {verifyingPass ? <Loader2 size={14} className="animate-spin text-blue-500 absolute right-3 top-1/2 -translate-y-1/2" /> : (
                        <button type="button" onClick={() => setShowCurrentPass(!showCurrentPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                          {showCurrentPass ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      )}
                    </div>
                    {passVerified && <p className="text-xs text-green-500 mt-1 flex items-center gap-1"><CheckCircle2 size={13} />Password saat ini sesuai</p>}
                  </FormField>

                  <div className="flex items-center justify-end">
                    <button onClick={() => setForgotPwOpen(true)} className="text-xs text-blue-600 hover:underline">Lupa password?</button>
                  </div>

                  <FormField label="Password Baru" required>
                    <div className="relative">
                      <input value={newPass} onChange={e => setNewPass(e.target.value)}
                        type={showNewPass ? "text" : "password"} placeholder="Minimal 6 karakter"
                        className={`${inputCls} pr-9`} disabled={!passVerified} />
                      <button type="button" onClick={() => setShowNewPass(!showNewPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                        {showNewPass ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </FormField>

                  <FormField label="Konfirmasi Password Baru" required>
                    <div className="relative">
                      <input value={confirmPass} onChange={e => setConfirmPass(e.target.value)}
                        type={showConfirmPass ? "text" : "password"} placeholder="Ulangi password"
                        className={`${inputCls} pr-9`} disabled={!passVerified} />
                      <button type="button" onClick={() => setShowConfirmPass(!showConfirmPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                        {showConfirmPass ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </FormField>

                  <button onClick={handleSavePassword} disabled={savingPass || !passVerified || !newPass || !confirmPass}
                    className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 active:scale-95 rounded-xl transition-all disabled:opacity-50 disabled:active:scale-100">
                    {savingPass ? <><Loader2 size={15} className="animate-spin" />Menyimpan...</> : <><Save size={14} />Simpan Password</>}
                  </button>
                </div>
              </>
            ) : (
              <div className="space-y-3">
                {isGoogle === null ? null : isGoogle ? (
                  <div className="flex flex-col items-center gap-3 py-8 text-center">
                    <ShieldAlert size={36} className="text-slate-300 dark:text-slate-600" />
                    <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs">Akun Google tidak mendukung perubahan password manual. Gunakan akun Google Anda untuk masuk.</p>
                  </div>
                ) : (
                  <div className="flex items-center gap-4 p-4 border border-slate-100 dark:border-slate-800 rounded-xl hover:border-blue-200 dark:hover:border-blue-700 transition-colors cursor-pointer" onClick={() => setShowPasswordSection(true)}>
                    <div className="w-9 h-9 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center shrink-0"><Lock size={15} className="text-blue-600" /></div>
                    <div className="flex-1 min-w-0"><div className="text-sm font-semibold text-slate-700 dark:text-slate-300">Ubah Password</div><div className="text-xs text-slate-400">Perbarui password secara berkala</div></div>
                    <ChevronRight size={14} className="text-slate-400" />
                  </div>
                )}
                <div className="flex items-center gap-4 p-4 border border-slate-100 dark:border-slate-800 rounded-xl hover:border-blue-200 dark:hover:border-blue-700 transition-colors cursor-pointer"
                  onClick={async () => { setShowLoginHistory(true); setLoginHistoryLoading(true); try { const d = await getLoginHistory(); setLoginHistory(d); } catch { toast.error("Gagal memuat riwayat login"); setShowLoginHistory(false); } finally { setLoginHistoryLoading(false); } }}>
                  <div className="w-9 h-9 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center shrink-0"><History size={15} className="text-blue-600" /></div>
                  <div className="flex-1 min-w-0"><div className="text-sm font-semibold text-slate-700 dark:text-slate-300">Riwayat Login</div><div className="text-xs text-slate-400">Lihat aktivitas login terbaru</div></div>
                  <ChevronRight size={14} className="text-slate-400" />
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
                <thead><tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">{["Nama","Email","Role","Cabang",""].map(h => <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500">{h}</th>)}</tr></thead>
                <tbody>{users.map(u => (
                  <tr key={u.id} className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/30">
                    <td className="px-4 py-3"><div className="flex items-center gap-2"><div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 flex items-center justify-center text-xs font-bold">{u.full_name[0]}</div><span className="font-medium text-slate-700 dark:text-slate-300">{u.full_name}</span></div></td>
                    <td className="px-4 py-3 text-xs text-slate-400">{u.email}</td>
                    <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-400">{u.role === 'super_admin' ? 'Super Admin' : 'Admin Cabang'}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{u.branch || 'Semua'}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => { setEditingUser(u); setModalOpen(true); }} className="text-xs text-blue-600 hover:underline font-medium">Edit</button>
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
          <Card className="p-4 sm:p-6">
            <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-5">Audit Log</h3>
            <div className="flex flex-col sm:flex-row flex-wrap items-end gap-3 mb-4">
              <div className="flex flex-col gap-1 w-full sm:w-auto">
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Filter Aksi</label>
                <select value={auditFilterAction} onChange={e => { setAuditFilterAction(e.target.value); setAuditLogsPage(1); }} className={`${inputCls} text-xs py-1.5 w-full sm:w-40`}>
                  <option value="">Semua Aksi</option>
                  <option value="update">Update Sparepart</option>
                  <option value="approve_po">Setujui PO</option>
                  <option value="receive_po">Terima PO</option>
                  <option value="cancel_po">Batal PO</option>
                  <option value="postpone_restock">Tunda Restock</option>
                  <option value="reactivate_restock">Aktifkan Restock</option>
                  <option value="in">Stok Masuk</option>
                  <option value="out">Stok Keluar</option>
                  <option value="transfer">Transfer Stok</option>
                  <option value="adjustment">Penyesuaian Stok</option>
                </select>
              </div>
              <div className="flex flex-col gap-1 w-full sm:w-auto">
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Dari Tanggal</label>
                <input type="date" value={auditFilterStartDate} onChange={e => { setAuditFilterStartDate(e.target.value); setAuditLogsPage(1); }} className={`${inputCls} text-xs py-1.5 w-full sm:w-36`} />
              </div>
              <div className="flex flex-col gap-1 w-full sm:w-auto">
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Sampai Tanggal</label>
                <input type="date" value={auditFilterEndDate} onChange={e => { setAuditFilterEndDate(e.target.value); setAuditLogsPage(1); }} className={`${inputCls} text-xs py-1.5 w-full sm:w-36`} />
              </div>
            </div>
            {auditLogsLoading ? (
              <div className="space-y-3">{Array.from({length:5}).map((_,i)=><Skeleton key={i} className="h-12" />)}</div>
            ) : auditLogs.length === 0 ? (
              <div className="text-center py-10 text-sm text-slate-400">Belum ada audit log</div>
            ) : (
              <table className="w-full text-sm">
                <thead><tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">{["User","Aksi","Tipe","Waktu","IP"].map(h => <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500">{h}</th>)}</tr></thead>
                <tbody>{auditLogs.map(log => (
                  <tr key={log.id} onClick={() => setSelectedAuditLog(log)} className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/30 cursor-pointer">
                    <td className="px-4 py-3"><div className="flex items-center gap-2"><div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 flex items-center justify-center text-xs font-bold">{log.user_name[0] || '?'}</div><span className="font-medium text-slate-700 dark:text-slate-300">{log.user_name}</span></div></td>
                    <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-400 max-w-48 truncate">{log.action}</td>
                    <td className="px-4 py-3"><span className="text-xs px-2 py-0.5 rounded-full font-medium bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">{log.entity_type}</span></td>
                    <td className="px-4 py-3 text-xs text-slate-400">{new Date(log.created_at).toLocaleString('id-ID')}</td>
                    <td className="px-4 py-3 text-xs text-slate-400" style={{ fontFamily:"'JetBrains Mono', monospace" }}>{log.ip_address || <span className="text-slate-300 dark:text-slate-600">&mdash;</span>}</td>
                  </tr>
                ))}</tbody>
              </table>
            )}
            {auditLogsMeta.total_pages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                <span className="text-xs text-slate-400">Total {auditLogsMeta.total} log</span>
                <div className="flex items-center gap-2">
                  <button onClick={() => setAuditLogsPage(p => Math.max(1, p-1))} disabled={auditLogsPage <= 1} className="px-3 py-1 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-30">Prev</button>
                  <span className="text-xs text-slate-500">{auditLogsPage} / {auditLogsMeta.total_pages}</span>
                  <button onClick={() => setAuditLogsPage(p => Math.min(auditLogsMeta.total_pages, p+1))} disabled={auditLogsPage >= auditLogsMeta.total_pages} className="px-3 py-1 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-30">Next</button>
                </div>
              </div>
            )}
            {selectedAuditLog && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setSelectedAuditLog(null)}>
                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                  <div className="p-5 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-slate-800 dark:text-slate-200">Detail Audit Log</h4>
                      <button onClick={() => setSelectedAuditLog(null)} className="text-slate-400 hover:text-slate-600 text-lg leading-none">&times;</button>
                    </div>
                  </div>
                  <div className="p-5 space-y-4 text-sm">
                    <div className="grid grid-cols-2 gap-3">
                      <div><div className="text-xs text-slate-400">User</div><div className="font-medium text-slate-700 dark:text-slate-300">{selectedAuditLog.user_name}</div></div>
                      <div><div className="text-xs text-slate-400">Email</div><div className="font-medium text-slate-700 dark:text-slate-300">{selectedAuditLog.user_email}</div></div>
                      <div><div className="text-xs text-slate-400">Aksi</div><div className="font-medium text-slate-700 dark:text-slate-300">{selectedAuditLog.action}</div></div>
                      <div><div className="text-xs text-slate-400">Tipe Entitas</div><div className="font-medium text-slate-700 dark:text-slate-300">{selectedAuditLog.entity_type}</div></div>
                      <div><div className="text-xs text-slate-400">ID Entitas</div><div className="font-medium text-slate-700 dark:text-slate-300 text-xs truncate">{selectedAuditLog.entity_id || '-'}</div></div>
                      <div><div className="text-xs text-slate-400">IP Address</div><div className="font-medium text-slate-700 dark:text-slate-300">{selectedAuditLog.ip_address || <span className="text-slate-400 italic">Tidak tercatat</span>}</div></div>
                      <div className="col-span-2"><div className="text-xs text-slate-400">Waktu</div><div className="font-medium text-slate-700 dark:text-slate-300">{new Date(selectedAuditLog.created_at).toLocaleString('id-ID')}</div></div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div><div className="text-xs text-slate-400 mb-1 font-semibold">Data Lama (old_data)</div><pre className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3 text-xs overflow-auto max-h-40" style={{ fontFamily:"'JetBrains Mono', monospace" }}>{JSON.stringify(selectedAuditLog.old_data, null, 2)}</pre></div>
                      <div><div className="text-xs text-slate-400 mb-1 font-semibold">Data Baru (new_data)</div><pre className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3 text-xs overflow-auto max-h-40" style={{ fontFamily:"'JetBrains Mono', monospace" }}>{JSON.stringify(selectedAuditLog.new_data, null, 2)}</pre></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </Card>
        )}
        {tab === "about" && (
          <Card className="p-6 text-center">
            <div className="w-14 h-14 bg-blue-700 rounded-2xl flex items-center justify-center mx-auto mb-4"><BarChart3 size={24} className="text-white" /></div>
            <h3 className="font-bold text-slate-800 dark:text-slate-200 text-xl mb-1" style={{ fontFamily:"'Plus Jakarta Sans', sans-serif" }}>SpareTrack</h3>
            <div className="text-xs text-blue-600 font-semibold mb-2">Multi-Branch Spare Parts Management System</div>
            <div className="text-sm text-slate-500 mb-5">Versi 2.0.0 · React + Node.js</div>
            <p className="text-xs text-slate-400">© 2026 SpareTrack. All rights reserved.</p>
          </Card>
        )}
      </div>
    </div>
    <ForgotPasswordModal open={forgotPwOpen} onClose={() => setForgotPwOpen(false)} email={sessionEmail} />
  </>);
}

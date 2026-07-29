import { useState, useEffect, useRef } from "react";
import {
  LayoutDashboard, Package, ShoppingCart, ArrowLeftRight,
  FileBarChart, Settings, Bell, Search, Menu, X, Sun, Moon,
  ChevronRight, BarChart3, User, LogOut, Loader2,
} from "lucide-react";
import { toast, Toaster } from "sonner";


import { ROLE_CFG, NAV_SECTIONS, PAGE_TITLES } from "./config";
import { supabase } from "./services/supabase";
import { logout as logoutApi } from "./services/auth";
import { AddItemModal } from "./components/modals/AddItemModal";
import { StokMasukModal } from "./components/modals/StokMasukModal";
import { StokKeluarModal } from "./components/modals/StokKeluarModal";
import { TransferModal } from "./components/modals/TransferModal";
import { EditProfileModal } from "./components/modals/EditProfileModal";
import { CommandPalette } from "./components/CommandPalette";
import { DetailDrawer } from "./components/DetailDrawer";
import { LandingPage } from "./pages/auth/LandingPage";
import { LoginPage } from "./pages/auth/LoginPage";
import { RegisterPage } from "./pages/auth/RegisterPage";
import { ForgotPage } from "./pages/auth/ForgotPage";
import { OTPPage } from "./pages/auth/OTPPage";
import { ResetPasswordPage } from "./pages/auth/ResetPasswordPage";
import { DashboardPage } from "./pages/app/DashboardPage";
import { InventoryPage } from "./pages/app/InventoryPage";
import { RestockPage } from "./pages/app/RestockPage";
import { BranchesPage } from "./pages/app/BranchesPage";
import { TransactionsPage } from "./pages/app/TransactionsPage";
import { ReportsPage } from "./pages/app/ReportsPage";
import { SettingsPage } from "./pages/app/SettingsPage";
import { list as fetchNotifsApi, getUnreadCount, markRead as markReadApi, markAllRead as markAllReadApi } from "./services/notifications";
import { api } from "./services/client";
import type { NotificationItem } from "./services/notifications";
import type { SparepartDetail } from "./services/inventory";
import type { AppState, PageId, Role } from "./types";

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  branch: string;
  role: Role;
  theme_preference?: string;
}

export default function App() {
  const [appState, setAppState] = useState<AppState>("loading");
  const appStateRef = useRef(appState);
  appStateRef.current = appState;
  const [page, setPage] = useState<PageId>("dashboard");
  const [selectedPart, setSelectedPart] = useState<string | null>(null);
  const [inventoryFilter, setInventoryFilter] = useState("all");
  const [inventoryBranch, setInventoryBranch] = useState("all");
  const [restockFilter, setRestockFilter] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [notifOpen, setNotifOpen] = useState(false);
  const [profileDropOpen, setProfileDropOpen] = useState(false);
  const [profileEditOpen, setProfileEditOpen] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');
  const [currentRole, setCurrentRole] = useState<Role>("super_admin");
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [otpEmail, setOtpEmail] = useState("");

  const [addItemOpen, setAddItemOpen] = useState(false);
  const [stokMasukOpen, setStokMasukOpen] = useState(false);
  const [stokKeluarOpen, setStokKeluarOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [modalSparepart, setModalSparepart] = useState<SparepartDetail | null>(null);

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifLoading, setNotifLoading] = useState(false);

  useEffect(() => { document.documentElement.classList.toggle("dark", darkMode); }, [darkMode]);

  useEffect(() => {
    localStorage.setItem('theme', darkMode ? 'dark' : 'light');
    if (appState !== 'app' || !userProfile?.id) return;
    api.patch('/me', { theme_preference: darkMode ? 'dark' : 'light' }).catch(() => {
      toast.error("Gagal menyimpan preferensi tema");
    });
  }, [darkMode, appState, userProfile?.id]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if ((e.ctrlKey || e.metaKey) && e.key === "k") { e.preventDefault(); setCmdOpen(true); } };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        fetchProfile();
      } else {
        setAppState("landing");
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session && appStateRef.current !== "otp" && appStateRef.current !== "reset_password") {
        fetchProfile();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (appState !== "app") return;
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, [appState]);

  useEffect(() => {
    if (notifOpen) fetchNotifications();
  }, [notifOpen]);

  useEffect(() => {
    if (appState !== "app" || !userProfile?.id) return;
    const channel = supabase
      .channel('notifications')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userProfile.id}` },
        (payload) => {
          const n = payload.new as NotificationItem;
          setNotifications(prev => [n, ...prev.slice(0, 19)]);
          setUnreadCount(prev => prev + 1);
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [appState, userProfile?.id]);

  async function fetchProfile() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user');
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, email, full_name, phone, branch, role')
        .eq('id', user.id)
        .single();

      if (profile) {
        setUserProfile(profile as UserProfile);
        setCurrentRole(profile.role as Role);
        if (profile.theme_preference) {
          const prefersDark = profile.theme_preference === 'dark';
          setDarkMode(prefersDark);
          localStorage.setItem('theme', prefersDark ? 'dark' : 'light');
        }
      } else {
        setUserProfile({
          id: user.id,
          email: user.email || '',
          full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
          phone: user.user_metadata?.phone || '',
          branch: user.user_metadata?.branch || '',
          role: (user.user_metadata?.role as Role) || 'branch_admin',
          theme_preference: localStorage.getItem('theme') || 'light',
        });
      }
      if (appStateRef.current !== "otp" && appStateRef.current !== "reset_password") {
        setAppState("app");
      }
    } catch {
      if (appStateRef.current !== "otp" && appStateRef.current !== "reset_password") {
        setAppState("landing");
      }
    }
  }

  function navigate(p: PageId, filter?: string) {
    setPage(p); setSelectedPart(null); setSidebarOpen(false);
    if (p === "restock") { setRestockFilter(filter || ""); }
    else { setRestockFilter(""); if (filter) setInventoryFilter(filter); else if (p !== "inventory") setInventoryFilter("all"); }
  }
  function quickAction(action: string, sparepart?: SparepartDetail | null) {
    setModalSparepart(null);
    if (action === "add_item")    setAddItemOpen(true);
    else if (action === "stok_masuk")  { setModalSparepart(sparepart || null); setStokMasukOpen(true); }
    else if (action === "stok_keluar") { setModalSparepart(sparepart || null); setStokKeluarOpen(true); }
    else if (action === "transfer")    setTransferOpen(true);
    else if (action === "po")          navigate("restock");
    else toast.info("Fitur ini belum tersedia pada mode demo");
  }

  async function handleLogout() {
    try {
      await logoutApi();
      setUserProfile(null);
      setAppState("landing");
      toast.success("Sesi berakhir.");
    } catch {
      toast.error("Gagal logout");
    }
  }

  async function fetchNotifications() {
    setNotifLoading(true);
    try {
      const res = await fetchNotifsApi(1, 10);
      setNotifications(res.data);
    } catch { /* ignore */ }
    setNotifLoading(false);
  }

  async function fetchUnread() {
    try {
      const { count } = await getUnreadCount();
      setUnreadCount(count);
    } catch { /* ignore */ }
  }

  async function handleNotifClick(n: NotificationItem) {
    if (n.link) {
      navigate(n.link.replace('/', '') as PageId);
    }
    if (!n.is_read) {
      try {
        await markReadApi(n.id);
        setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, is_read: true } : x));
        setUnreadCount(prev => Math.max(0, prev - 1));
      } catch { /* ignore */ }
    }
    setNotifOpen(false);
  }

  async function handleMarkAllRead() {
    try {
      await markAllReadApi();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
      toast.success("Semua ditandai dibaca");
    } catch { /* ignore */ }
  }

  const allowedPages = ROLE_CFG[currentRole].pages;

  return (
    <>
      <Toaster position="top-right" richColors />
      {appState === "loading" && (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
          <Loader2 size={32} className="animate-spin text-blue-600" />
        </div>
      )}
      {appState === "landing" && <LandingPage onLogin={() => setAppState("login")} />}
      {appState === "login" && <LoginPage onSuccess={() => { fetchProfile(); }} onRegister={() => setAppState("register")} onForgot={() => setAppState("forgot")} onBack={() => setAppState("landing")} />}
      {appState === "register" && <RegisterPage onLogin={() => setAppState("login")} />}
      {appState === "forgot" && <ForgotPage onOTP={(email) => { setOtpEmail(email); setAppState("otp"); }} onLogin={() => setAppState("login")} />}
      {appState === "otp" && <OTPPage email={otpEmail} onSuccess={() => setAppState("reset_password")} onBack={() => setAppState("forgot")} />}
      {appState === "reset_password" && <ResetPasswordPage onComplete={() => setAppState("login")} />}
      {appState === "app" && (
        <div className="flex h-screen overflow-hidden bg-background">

      {/* Global modals */}
      <AddItemModal    open={addItemOpen}    onClose={() => setAddItemOpen(false)}    />
      <StokMasukModal  open={stokMasukOpen}  onClose={() => { setStokMasukOpen(false); setModalSparepart(null); }}  userProfile={userProfile} currentRole={currentRole} sparepart={modalSparepart ?? undefined} />
      <StokKeluarModal open={stokKeluarOpen} onClose={() => { setStokKeluarOpen(false); setModalSparepart(null); }} userProfile={userProfile} currentRole={currentRole} sparepart={modalSparepart ?? undefined} />
      <TransferModal   open={transferOpen}   onClose={() => setTransferOpen(false)}   userProfile={userProfile} currentRole={currentRole} />
      <EditProfileModal open={profileEditOpen} onClose={() => setProfileEditOpen(false)} onSaved={() => fetchProfile()} profile={userProfile} />
      <CommandPalette open={cmdOpen} onClose={() => setCmdOpen(false)} onNavigate={navigate} onAction={quickAction} onSelectPart={setSelectedPart} />
      <DetailDrawer partId={selectedPart} onClose={() => setSelectedPart(null)} filterBranch={inventoryBranch} onAction={quickAction} />

      {sidebarOpen && <div className="fixed inset-0 bg-black/40 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* ── SIDEBAR ── */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-30 w-60 flex flex-col transition-transform duration-300 lg:translate-x-0 ${sidebarOpen?"translate-x-0":"-translate-x-full"}`} style={{ background: "#0d1b3e" }}>
        <div className="flex items-center gap-3 px-5 py-5" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shrink-0"><BarChart3 size={15} className="text-white" /></div>
          <div className="min-w-0 flex-1"><div className="text-sm font-bold text-white">SpareTrack</div><div className="text-xs" style={{ color:"#6880b8" }}>Multi-Branch System</div></div>
          <button className="lg:hidden text-white/50 hover:text-white" onClick={() => setSidebarOpen(false)}><X size={15} /></button>
        </div>
        <nav className="flex-1 px-3 py-3 overflow-y-auto space-y-3">
          {NAV_SECTIONS.map(section => {
            if (section.roles && !section.roles.includes(currentRole)) return null;
            const items = section.items.filter(i => allowedPages.includes(i.id));
            if (items.length === 0) return null;
            return (
              <div key={section.title}>
                <div className="text-xs font-semibold px-2 mb-1.5" style={{ color:"#3d5080", letterSpacing:"0.09em" }}>{section.title}</div>
                <div className="space-y-0.5">
                  {items.map(item => {
                    const active = page === item.id && !selectedPart;
                    return (
                      <button key={item.id} onClick={() => navigate(item.id)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all"
                        style={active ? { background:"rgba(77,124,254,0.18)", color:"#7ba7ff" } : { color:"#8898c4" }}
                        onMouseEnter={e => { if (!active) (e.currentTarget as HTMLButtonElement).style.color="#c8d4f0"; }}
                        onMouseLeave={e => { if (!active) (e.currentTarget as HTMLButtonElement).style.color="#8898c4"; }}
                      >
                        <item.icon size={15} />{item.label}
                        {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-400" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>
        <div className="px-3 py-4" style={{ borderTop:"1px solid rgba(255,255,255,0.07)" }}>
          <button onClick={() => setProfileEditOpen(true)} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all" style={{ background:"rgba(255,255,255,0.04)" }}
            onMouseEnter={e => (e.currentTarget.style.background="rgba(255,255,255,0.07)")}
            onMouseLeave={e => (e.currentTarget.style.background="rgba(255,255,255,0.04)")}
          >
            <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold text-white shrink-0">{userProfile?.full_name?.charAt(0) || "A"}</div>
            <div className="min-w-0 flex-1 text-left"><div className="text-xs font-medium text-white truncate">{userProfile?.full_name || "Admin"}</div><div className="text-xs truncate" style={{ color:"#6880b8" }}>{userProfile?.email || "user@sparetrack.id"}</div></div>
            <ChevronRight size={12} style={{ color:"#6880b8" }} />
          </button>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* TOPBAR */}
        <header className="shrink-0 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 px-4 lg:px-6 py-3 flex items-center gap-3">
          <button className="lg:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition" onClick={() => setSidebarOpen(true)}><Menu size={17} /></button>
          <div className="flex items-center gap-1.5 text-sm text-slate-400 min-w-0">
            <span className="hidden sm:inline text-slate-400">SpareTrack</span>
            <ChevronRight size={12} className="hidden sm:inline text-slate-300" />
            <span className="font-semibold text-slate-700 dark:text-slate-300 truncate">{PAGE_TITLES[selectedPart?"detail":page]??page}</span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <div className="hidden lg:block">
              <button onClick={() => setCmdOpen(true)} className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:border-blue-400 transition-all">
                <Search size={12} className="text-slate-400" />
                <span className="text-sm text-slate-400 w-56">Cari menu, aksi, atau sparepart...</span>
                <kbd className="px-1.5 py-0.5 text-xs bg-slate-200 dark:bg-slate-700 text-slate-500 rounded border border-slate-300 dark:border-slate-600" style={{ fontFamily:"'JetBrains Mono', monospace" }}>⌘K</kbd>
              </button>
            </div>
            <button onClick={() => setDarkMode(!darkMode)} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition" title={darkMode?"Light mode":"Dark mode"}>
              {darkMode ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            {/* Notifications */}
            <div className="relative">
              <button onClick={() => { setNotifOpen(!notifOpen); setProfileDropOpen(false); }} className="relative p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition">
                <Bell size={16} />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center font-bold px-1" style={{ fontSize:"9px" }}>{unreadCount > 99 ? '99+' : unreadCount}</span>
                )}
              </button>
              {notifOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />
                  <div className="absolute right-0 top-full mt-2 w-80 max-sm:fixed max-sm:inset-x-4 max-sm:top-16 max-sm:w-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-50 overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                      <span className="font-semibold text-sm text-slate-800 dark:text-slate-200">Notifikasi</span>
                      {unreadCount > 0 && (
                        <button onClick={handleMarkAllRead} className="text-xs text-blue-600 hover:underline">Tandai semua dibaca</button>
                      )}
                    </div>
                    {notifLoading ? (
                      <div className="px-4 py-8 text-center text-xs text-slate-400">Memuat...</div>
                    ) : notifications.length === 0 ? (
                      <div className="px-4 py-8 text-center text-xs text-slate-400">Belum ada notifikasi</div>
                    ) : (
                      <div className="max-h-80 overflow-y-auto">
                        {notifications.map(n => {
                          const typeColor = n.type === 'warning' ? 'bg-amber-500' : n.type === 'success' ? 'bg-emerald-500' : n.type === 'error' ? 'bg-red-500' : 'bg-blue-500';
                          return (
                            <div key={n.id} onClick={() => handleNotifClick(n)}
                              className={`px-4 py-3 border-b border-slate-50 dark:border-slate-800/50 flex items-start gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/30 cursor-pointer transition ${!n.is_read ? 'bg-blue-50/40 dark:bg-blue-900/10' : ''}`}>
                              <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${typeColor}`} />
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-slate-800 dark:text-slate-200">{n.title}</p>
                                <p className="text-xs text-slate-500 mt-0.5 leading-snug">{n.message}</p>
                                <p className="text-xs text-slate-400 mt-1">{new Date(n.created_at).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}</p>
                              </div>
                              {!n.is_read && <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5 shrink-0" />}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
            {/* Profile */}
            <div className="relative">
              <button onClick={() => { setProfileDropOpen(!profileDropOpen); setNotifOpen(false); }} className="w-7 h-7 rounded-full bg-blue-700 hover:bg-blue-800 flex items-center justify-center text-xs font-bold text-white transition">{userProfile?.full_name?.charAt(0) || 'A'}</button>
              {profileDropOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setProfileDropOpen(false)} />
                  <div className="absolute right-0 top-full mt-2 w-52 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-50 overflow-hidden p-1">
                    <div className="px-3 py-2.5 mb-0.5">
                      <div className="font-semibold text-sm text-slate-800 dark:text-slate-200">{userProfile?.full_name || "Admin"}</div>
                      <div className="text-xs text-slate-400">{userProfile?.email || "user@sparetrack.id"}</div>
                      <div className="mt-1"><span className={`text-xs px-1.5 py-0.5 rounded font-medium ${ROLE_CFG[currentRole].cls}`}>{ROLE_CFG[currentRole].label}</span></div>
                    </div>
                    <div className="border-t border-slate-100 dark:border-slate-800 my-1" />
                    {[
                      { label:"Edit Profil", icon:User,                  fn:() => { setProfileEditOpen(true); setProfileDropOpen(false); } },
                      { label:"Settings",    icon:Settings,               fn:() => { navigate("settings"); setProfileDropOpen(false); } },
                      { label:darkMode?"Light Mode":"Dark Mode", icon:darkMode?Sun:Moon, fn:() => { setDarkMode(!darkMode); setProfileDropOpen(false); } },
                    ].map(item => (
                      <button key={item.label} onClick={item.fn} className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition"><item.icon size={13} className="text-slate-400" />{item.label}</button>
                    ))}
                    <div className="border-t border-slate-100 dark:border-slate-800 my-1" />
                    <button onClick={() => { handleLogout(); setProfileDropOpen(false); }} className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"><LogOut size={13} />Keluar</button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* CONTENT */}
        <main className="flex-1 overflow-y-auto px-4 lg:px-6 py-5">
          {page === "dashboard"    && !selectedPart && <DashboardPage onNavigate={navigate} onAction={quickAction} />}
          {page === "inventory"    && <InventoryPage onSelectPart={setSelectedPart} initialFilter={inventoryFilter} filterBranch={inventoryBranch} onBranchChange={setInventoryBranch} userProfile={userProfile} currentRole={currentRole} onAction={quickAction} />}
          {page === "restock"      && !selectedPart && <RestockPage userProfile={userProfile} scrollTo={restockFilter} />}
          {page === "branches"     && !selectedPart && <BranchesPage />}
          {page === "transactions" && !selectedPart && <TransactionsPage userProfile={userProfile} onAction={quickAction} />}
          {page === "reports"      && !selectedPart && <ReportsPage userProfile={userProfile} />}
          {page === "settings"     && !selectedPart && <SettingsPage onEditProfile={() => setProfileEditOpen(true)} currentRole={currentRole} />}
          </main>
        </div>
      </div>
      )}
    </>
  );
}

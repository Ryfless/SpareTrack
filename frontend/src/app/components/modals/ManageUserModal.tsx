import React, { useState, useEffect } from "react";
import { Save } from "lucide-react";
import { toast } from "sonner";
import { Modal } from "../shared/Modal";
import { FormField } from "../shared/FormField";
import { inputCls } from "../../config";
import { createUser, updateUser, type User } from "../../services/users";
import { list as getBranches, type Branch } from "../../services/branches";

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  user?: User | null;
}

export function ManageUserModal({ open, onClose, onSaved, user }: Props) {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [form, setForm] = useState({
    full_name: "", email: "", password: "", role: "branch_admin", branch: "", phone: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getBranches().then(setBranches).catch(() => {});
  }, []);

  useEffect(() => {
    if (user) {
      setForm({
        full_name: user.full_name,
        email: user.email,
        password: "",
        role: user.role,
        branch: user.branch,
        phone: user.phone,
      });
    } else {
      setForm({ full_name: "", email: "", password: "", role: "branch_admin", branch: "", phone: "" });
    }
  }, [user, open]);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  async function handleSave() {
    if (!form.full_name || !form.email) {
      toast.error("Nama dan email wajib diisi");
      return;
    }
    if (!user && !form.password) {
      toast.error("Password wajib diisi untuk user baru");
      return;
    }
    setSaving(true);
    try {
      if (user) {
        await updateUser(user.id, {
          full_name: form.full_name,
          role: form.role,
          branch: form.branch,
          phone: form.phone,
        });
        toast.success("User berhasil diperbarui");
      } else {
        await createUser({
          email: form.email,
          full_name: form.full_name,
          password: form.password,
          role: form.role,
          branch: form.branch,
          phone: form.phone,
        });
        toast.success("User berhasil dibuat");
      }
      onSaved();
      onClose();
    } catch {
      toast.error(user ? "Gagal memperbarui user" : "Gagal membuat user");
    } finally {
      setSaving(false);
    }
  }

  const initial = user?.full_name?.[0] || null;

  return (
    <Modal open={open} onClose={onClose} title={user ? "Edit Pengguna" : "Tambah Pengguna"} size="md">
      {user && (
        <div className="flex items-center gap-3 mb-5 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 flex items-center justify-center text-sm font-bold shrink-0">{initial}</div>
          <div>
            <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">{user.full_name}</div>
            <div className="text-xs text-slate-400">{user.email}</div>
          </div>
        </div>
      )}
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Nama Lengkap" required>
            <input value={form.full_name} onChange={set("full_name")} className={inputCls} placeholder="Nama user" />
          </FormField>
          <FormField label="Email" required>
            <input value={form.email} onChange={set("email")} type="email" className={inputCls} placeholder="email@example.com" disabled={!!user} />
          </FormField>
        </div>
        {!user && (
          <FormField label="Password" required>
            <input value={form.password} onChange={set("password")} type="password" className={inputCls} placeholder="Minimal 6 karakter" />
          </FormField>
        )}
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Role">
            <select value={form.role} onChange={set("role")} className={inputCls}>
              <option value="branch_admin">Admin Cabang</option>
              <option value="super_admin">Super Admin</option>
            </select>
          </FormField>
          <FormField label="Cabang">
            <select value={form.branch} onChange={set("branch")} className={inputCls}>
              <option value="">-- Semua Cabang --</option>
              {branches.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
            </select>
          </FormField>
        </div>
        <FormField label="No. HP">
          <input value={form.phone} onChange={set("phone")} className={inputCls} placeholder="08xxxxxxxxxx" />
        </FormField>
      </div>
      <div className="flex gap-3 mt-5">
        <button onClick={handleSave} disabled={saving} className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 active:scale-95 rounded-xl transition-all disabled:opacity-50">
          <Save size={15} />{saving ? "Menyimpan..." : "Simpan"}
        </button>
        <button onClick={onClose} className="px-4 text-sm font-medium text-slate-600 bg-slate-100 dark:bg-slate-800 dark:text-slate-400 rounded-xl transition">Batal</button>
      </div>
    </Modal>
  );
}

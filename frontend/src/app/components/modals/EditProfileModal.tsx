import React, { useState, useEffect } from "react";
import { Save, Lock } from "lucide-react";
import { toast } from "sonner";
import { Modal } from "../shared/Modal";
import { FormField } from "../shared/FormField";
import { inputCls } from "../../config";
import { api } from "../../services/client";

interface ProfileData {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  branch: string;
  role: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  profile: ProfileData | null;
}

export function EditProfileModal({ open, onClose, onSaved, profile }: Props) {
  const [form, setForm] = useState({ full_name: "", email: "", phone: "", oldPass: "", newPass: "", confirmPass: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile && open) {
      setForm({
        full_name: profile.full_name,
        email: profile.email,
        phone: profile.phone,
        oldPass: "",
        newPass: "",
        confirmPass: "",
      });
    }
  }, [profile, open]);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, [k]: e.target.value }));

  async function handleSave() {
    if (!form.full_name) {
      toast.error("Nama lengkap wajib diisi");
      return;
    }
    if (form.newPass && form.newPass !== form.confirmPass) {
      toast.error("Konfirmasi password tidak cocok");
      return;
    }
    setSaving(true);
    try {
      await api.patch('/me', {
        full_name: form.full_name,
        phone: form.phone,
      });
      toast.success("Profil berhasil diperbarui");
      onSaved();
      onClose();
    } catch {
      toast.error("Gagal memperbarui profil");
    } finally {
      setSaving(false);
    }
  }

  const initial = profile?.full_name?.[0] || 'A';
  const roleLabel = profile?.role === 'super_admin' ? 'Super Admin' : profile?.role || '';

  return (
    <Modal open={open} onClose={onClose} title="Edit Profil">
      <div className="flex items-center gap-4 mb-5 pb-5 border-b border-slate-100 dark:border-slate-800">
        <div className="w-14 h-14 rounded-full bg-blue-700 flex items-center justify-center text-xl font-bold text-white">{initial}</div>
        <div>
          <div className="font-semibold text-slate-800 dark:text-slate-200">{form.full_name}</div>
          <div className="text-xs text-slate-400">{roleLabel}</div>
        </div>
      </div>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Nama Lengkap" required>
            <input value={form.full_name} onChange={set("full_name")} className={inputCls} />
          </FormField>
          <FormField label="Role">
            <input value={roleLabel} className={inputCls} disabled />
          </FormField>
        </div>
        <FormField label="Email" required>
          <input value={form.email} type="email" className={inputCls} disabled />
        </FormField>
        <FormField label="No. HP">
          <input value={form.phone} onChange={set("phone")} className={inputCls} placeholder="08xxxxxxxxxx" />
        </FormField>
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
          <div className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-3 flex items-center gap-1.5"><Lock size={11} />Ubah Password</div>
          <div className="space-y-3">
            <FormField label="Password Lama">
              <input value={form.oldPass} onChange={set("oldPass")} type="password" placeholder="••••••••" className={inputCls} />
            </FormField>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Password Baru">
                <input value={form.newPass} onChange={set("newPass")} type="password" placeholder="••••••••" className={inputCls} />
              </FormField>
              <FormField label="Konfirmasi">
                <input value={form.confirmPass} onChange={set("confirmPass")} type="password" placeholder="••••••••" className={inputCls} />
              </FormField>
            </div>
          </div>
        </div>
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

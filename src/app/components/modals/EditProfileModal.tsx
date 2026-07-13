import React, { useState } from "react";
import { Save, Lock } from "lucide-react";
import { toast } from "sonner";
import { Modal } from "../shared/Modal";
import { FormField } from "../shared/FormField";
import { inputCls } from "../../config";

export function EditProfileModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [form, setForm] = useState({ nama: "Admin Pusat", email: "admin@sparetrack.id", jabatan: "Administrator", hp: "081234567890", oldPass: "", newPass: "", confirmPass: "" });
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, [k]: e.target.value }));
  return (
    <Modal open={open} onClose={onClose} title="Edit Profil">
      <div className="flex items-center gap-4 mb-5 pb-5 border-b border-slate-100 dark:border-slate-800">
        <div className="w-14 h-14 rounded-full bg-blue-700 flex items-center justify-center text-xl font-bold text-white">A</div>
        <div><div className="font-semibold text-slate-800 dark:text-slate-200">{form.nama}</div><div className="text-xs text-slate-400">{form.jabatan}</div><button className="text-xs text-blue-600 hover:underline mt-0.5">Ganti foto</button></div>
      </div>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Nama Lengkap" required><input value={form.nama} onChange={set("nama")} className={inputCls} /></FormField>
          <FormField label="Jabatan"><input value={form.jabatan} onChange={set("jabatan")} className={inputCls} /></FormField>
        </div>
        <FormField label="Email" required><input value={form.email} onChange={set("email")} type="email" className={inputCls} /></FormField>
        <FormField label="No. HP"><input value={form.hp} onChange={set("hp")} className={inputCls} /></FormField>
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
          <div className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-3 flex items-center gap-1.5"><Lock size={11} />Ubah Password</div>
          <div className="space-y-3">
            <FormField label="Password Lama"><input value={form.oldPass} onChange={set("oldPass")} type="password" placeholder="••••••••" className={inputCls} /></FormField>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Password Baru"><input value={form.newPass} onChange={set("newPass")} type="password" placeholder="••••••••" className={inputCls} /></FormField>
              <FormField label="Konfirmasi"><input value={form.confirmPass} onChange={set("confirmPass")} type="password" placeholder="••••••••" className={inputCls} /></FormField>
            </div>
          </div>
        </div>
      </div>
      <div className="flex gap-3 mt-5">
        <button onClick={() => { if (form.newPass && form.newPass !== form.confirmPass) { toast.error("Konfirmasi password tidak cocok"); return; } toast.success("Profil berhasil diperbarui"); onClose(); }} className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 active:scale-95 rounded-xl transition-all"><Save size={15} />Simpan</button>
        <button onClick={onClose} className="px-4 text-sm font-medium text-slate-600 bg-slate-100 dark:bg-slate-800 dark:text-slate-400 rounded-xl transition">Batal</button>
      </div>
    </Modal>
  );
}

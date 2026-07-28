export interface HelpSegment {
  file: string;
  title: string;
  icon: string;
}

export const helpSegments: HelpSegment[] = [
  { file: '01-inventaris', title: 'Inventaris & Stok', icon: 'Package' },
  { file: '02-po', title: 'Purchase Order (PO)', icon: 'ShoppingCart' },
  { file: '03-restock', title: 'Restock & Prediksi ML', icon: 'Cpu' },
  { file: '04-logika', title: 'Logika & Perhitungan Sistem', icon: 'Calculator' },
  { file: '05-laporan', title: 'Laporan & Analitik', icon: 'BarChart3' },
  { file: '06-cabang', title: 'Manajemen Cabang', icon: 'Building2' },
  { file: '07-notifikasi', title: 'Notifikasi', icon: 'BellRing' },
  { file: '08-akun', title: 'Akun & Pengaturan', icon: 'UserCog' },
];

export function helpFileUrl(file: string): string {
  return `/help/${file}.md`;
}

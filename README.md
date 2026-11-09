# CGKN DIGIMAR – Project Management 

Aplikasi manajemen konten untuk tim DIGIMAR CGKN. Dipakai untuk merencanakan pilar konten, mencatat jadwal produksi konten per akun, dan memantau progres pengerjaan lewat board kanban.

## Fitur

- **Dashboard** – ringkasan jumlah project, total task, task selesai, dan task lewat tenggat, plus progres per group (klik group untuk melihat detail project di dalamnya).
- **Pilar Konten** – tabel yang bisa diedit langsung (auto save saat keluar dari sel):
  - Tabel overview pilar konten (deskripsi, contoh konten, tujuan, frekuensi).
  - Per akun: *Content Pillar Breakdown* dan *Story (Daily)*.
  - Tambah/hapus akun dan baris. Menghapus akun ikut menghapus breakdown dan story miliknya.
- **Project** – satu project = satu konten, ditampilkan sebagai tabel dengan inline edit:
  - Kolom: judul, group, pilar, jenis konten, tema, akun, keyword, hook, CTA, tanggal produksi / masuk editor / selesai / upload, PIC, dan status.
  - Status: `Belum`, `Proses`, `Selesai` (baris `Selesai` diberi highlight kuning).
  - Jenis konten: `Carousel`, `Single Image`, `Video/Reels`.
  - Pilihan pilar dan akun diambil dari halaman Pilar Konten.
- **Group project** – folder berwarna untuk mengelompokkan project (buat, ganti nama, ganti warna, hapus). Menghapus group tidak menghapus project di dalamnya.
- **Board kanban per project** – kolom dan task dengan drag & drop, prioritas, tenggat, penugasan ke PIC, dan checklist selesai.
- **Tema** – terang / gelap / ikuti sistem, tanpa kedipan saat load.
- **Sidebar** – bisa di-collapse (shortcut `Ctrl/Cmd + B`), menjadi drawer di mobile, dan daftar project dikelompokkan per group.

## Tech Stack

| Bagian | Teknologi |
| --- | --- |
| Framework | Next.js 16 (App Router, Server Actions, `cacheComponents`) |
| UI | React 19, Tailwind CSS 4, HeroUI v3, lucide-react, Radix UI |
| Drag & drop | `@hello-pangea/dnd` |
| Database | PostgreSQL (driver `pg`) |
| Bahasa | TypeScript |

## Prasyarat

- Node.js 20.6 atau lebih baru (script migrasi memakai `node --env-file`)
- PostgreSQL yang bisa diakses lewat connection string
- npm (atau package manager lain)

## Memulai

1. **Clone dan install dependensi**

   ```bash
   git clone https://github.com/hafiizherdian/pomen.git
   cd pomen
   npm install
   ```

2. **Buat file `.env.local`**

   ```env
   DATABASE_URL=postgres://USER:PASSWORD@HOST:5432/NAMA_DATABASE
   ```

3. **Siapkan database**

   ```bash
   npm run db:migrate   # membuat/menyesuaikan tabel dari db/schema.sql
   npm run db:seed      # opsional: data contoh (profil, project, kolom, task)
   ```

   `schema.sql` memakai `create table if not exists` dan `add column if not exists`, jadi aman dijalankan berulang kali.

4. **Letakkan logo** di `public/logo-cgkn.png` (dipakai di sidebar).

5. **Jalankan aplikasi**

## Scripts

| Perintah | Fungsi |
| --- | --- |
| `npm run build` | Build production |
| `npm run start` | Menjalankan hasil build |
| `npm run lint` | Menjalankan ESLint |
| `npm run db:migrate` | Menjalankan `db/schema.sql` |
| `npm run db:seed` | Menjalankan `db/schema.sql` lalu `db/seed.sql` |

## Struktur Folder

```
├── app/
│   ├── actions.ts            # Server actions: project, kolom, task, group
│   ├── pilar-actions.ts      # Server actions: tabel Pilar Konten & akun
│   ├── layout.tsx            # Layout utama (sidebar, tema)
│   ├── page.tsx              # Dashboard
│   ├── pilar/page.tsx        # Halaman Pilar Konten
│   ├── projects/
│   │   ├── page.tsx          # Folder group + tabel project
│   │   └── [slug]/page.tsx   # Board kanban satu project
│   └── components/
│       ├── app-sidebar.tsx
│       ├── group-progress.tsx
│       ├── pilar/            # Tabel pilar yang bisa diedit
│       ├── project/          # Tabel, dialog, kontrol group, dsb.
│       ├── theme/            # Provider, script, dan toggle tema
│       └── ui/               # Sidebar, kanban, folder icon, komponen dasar
├── db/
│   ├── schema.sql            # Skema database (idempotent)
│   └── seed.sql              # Data contoh
├── lib/
│   ├── db.ts                 # Pool pg + helper transaksi
│   ├── queries.ts            # Query project, group, board, profil
│   ├── pilar-queries.ts      # Query pilar, akun, dan opsi dropdown
│   ├── pilar-config.ts       # Definisi kolom tabel pilar
│   ├── project-config.ts     # Daftar status dan jenis konten
│   ├── types.ts              # Tipe data
│   └── utils.ts
└── scripts/
    └── migrate.mjs           # Runner migrasi/seed
```

## Skema Database

| Tabel | Isi |
| --- | --- |
| `profiles` | Anggota tim (email, nama), dipakai sebagai PIC dan penerima task |
| `project_groups` | Group/folder project (nama, warna, urutan) |
| `projects` | Satu konten: detail konten, jadwal, PIC, status, relasi ke group |
| `columns` | Kolom kanban per project |
| `tasks` | Task di dalam kolom (prioritas, tenggat, status selesai, penugasan) |
| `pilar_accounts` | Akun media sosial pada halaman Pilar Konten |
| `pilar_rows` | Baris tabel pilar (`overview`, `breakdown`, `story`, `target`), isinya disimpan sebagai `jsonb` |
| `pilar_settings` | Pengaturan lama pilar (dipakai hanya untuk migrasi data lama) |

Relasi penting:

- Menghapus project menghapus kolom dan task-nya (`on delete cascade`).
- Menghapus group hanya mengosongkan `group_id` project (`on delete set null`).
- Menghapus akun pilar menghapus baris breakdown dan story miliknya.

## Catatan Pengembangan

- Semua perubahan data dilakukan lewat Server Actions, lalu halaman di-revalidate dengan `revalidatePath`.
- Query ke database memanggil `connection()` sehingga data selalu dinamis (tidak di-cache saat build).
- Kolom `date` dan `timestamptz` dikembalikan sebagai string agar aman dikirim ke Client Component.
- Saat membuat project baru, slug dibuat dari judul. Jika bentrok, ditambahkan sufiks acak.
- Tidak ada sistem login; tabel `profiles` hanya berfungsi sebagai daftar anggota tim.

## Deployment

1. Set `DATABASE_URL` di environment hosting.
2. Jalankan migrasi sekali terhadap database tujuan (`npm run db:migrate`).
3. `npm run build` lalu `npm run start`.
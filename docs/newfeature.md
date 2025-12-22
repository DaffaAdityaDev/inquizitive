# The Neuro-Stack Architecture

Ini adalah **"The Neuro-Stack Architecture"**.
Desain sistem ini menggabungkan **Teknologi (Next.js/Supabase)** dengan **Neuroscience (Cara otak bekerja)** untuk menciptakan *loop* belajar yang sempurna.

Tujuannya: Mengubah data mentah (AI Output) menjadi memori jangka panjang (Long-Term Retention) dengan efisiensi maksimal.

---

## 1. The Core Philosophy: "The Learning Flywheel"

Sistem ini tidak linier, melainkan berputar (Cyclical).

1. **Acquire (Dapatkan):** Generate materi baru via AI (Flow State).
2. **Filter (Saring):** Identifikasi kelemahan via Kuis (Error Detection).
3. **Retain (Simpan):** Masukkan kelemahan ke "Vault" SRS (Storage).
4. **Reinforce (Perkuat):** Review berkala dengan algoritma penjarangan (Neuroplasticity).

---

## 2. System Design: Database Schema (Supabase)

Struktur data harus mendukung *Spaced Repetition* dan *Interleaving* (mencampur topik agar otak lebih aktif).

```sql
-- TABLE 1: REVIEW_ITEMS (The Vault)
-- Menyimpan unit terkecil pengetahuan yang kamu BELUM kuasai.
create table review_items (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  
  -- Content
  topic text not null,          -- e.g., "Golang Concurrency", "React Hooks"
  question_json jsonb not null, -- Struktur soal lengkap {q, options, answer, explanation}
  
  -- SRS Metrics (Otak Sistem)
  srs_level int default 0,      -- 0=New, 1=Hard, 2=Medium, 3=Easy, 4=Mastered
  ease_factor float default 2.5,-- Multiplier (mirip algoritma SuperMemo 2)
  interval_days int default 0,  -- Jarak hari ke review berikutnya
  
  -- Timing
  last_reviewed_at timestamp with time zone,
  next_review_at timestamp with time zone default now(), -- Default: Review segera
  created_at timestamp with time zone default now()
);

-- TABLE 2: LEARNING_STATS (Gamification)
-- Untuk melacak progress dan "Dopamine Hits"
create table learning_stats (
  user_id uuid references auth.users primary key,
  total_xp int default 0,
  current_streak int default 0,
  last_activity_date date default current_date,
  items_mastered int default 0
);
```

---

## 3. The Algorithm: "Modified SM-2" (Logic di Next.js)

Kita gunakan versi sederhana dari algoritma **SuperMemo-2** (yang dipakai Anki). Algoritma ini menentukan "Kapan soal ini harus muncul lagi?" berdasarkan performa kamu.

**Logic Flow (Server Action):**

1. **Input:** User menjawab soal di "Review Mode".
2. **Evaluation:** User menilai tingkat kesulitannya sendiri (atau otomatis dari Salah/Benar).
   - *Again (Salah)* -> Score 0
   - *Hard (Benar tapi mikir keras)* -> Score 3
   - *Good (Benar lancar)* -> Score 4
   - *Easy (Terlalu gampang)* -> Score 5

3. **Calculation:**

```typescript
// utils/srsAlgorithm.ts

interface SRSItem {
  interval: number; // Hari
  repetition: number; // Level
  easeFactor: number; // Pengali
}

export function calculateSRS(current: SRSItem, grade: number): SRSItem {
  let newInterval: number;
  let newRepetition: number;
  let newEaseFactor: number;

  if (grade < 3) {
    // Kalau Salah (Grade 0-2), Reset!
    newRepetition = 0;
    newInterval = 1; // Review lagi besok
    newEaseFactor = current.easeFactor; // Ease factor tetap
  } else {
    // Kalau Benar
    newEaseFactor = current.easeFactor + (0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02));
    if (newEaseFactor < 1.3) newEaseFactor = 1.3; // Batas bawah

    newRepetition = current.repetition + 1;

    // Hitung Interval (Hari)
    if (newRepetition === 1) {
      newInterval = 1;
    } else if (newRepetition === 2) {
      newInterval = 6;
    } else {
      newInterval = Math.round(current.interval * newEaseFactor);
    }
  }

  return { 
    interval: newInterval, 
    repetition: newRepetition, 
    easeFactor: newEaseFactor 
  };
}
```

---

## 4. The Product Flow (UX Design)

Ini adalah bagaimana sistem tersebut diterjemahkan ke tampilan aplikasi (**Inquizitive**).

### A. Mode 1: The "Forge" (Input & Discovery)

* **Action:** Paste JSON dari AI.
* **System:** Parsing -> Render Kuis.
* **Interaction:** User menjawab 10 soal.
* **Closing Loop:**
  * Jika Benar: *Discard* (Tidak perlu disimpan, buang-buang storage otak).
  * Jika Salah: **Auto-Save ke `review_items**`.
  * *Feedback:* Tampilkan penjelasan AI *kenapa* salah saat itu juga.

### B. Mode 2: The "Gym" (Daily Review)

* **Halaman Dashboard Utama.**
* **Logic:** Query Supabase `SELECT * FROM review_items WHERE next_review_at <= NOW()`.
* **UI:** Tampilkan kartu satu per satu (Interleaving). Campur topik (misal: 1 soal Golang, lalu 1 soal System Design).
* **Action:** User jawab -> Klik tombol: "Lupa", "Susah", "Ingat".
* **Effect:** Update `next_review_at` di DB.

### C. Mode 3: The "Library" (Browse)

* Daftar semua soal yang pernah salah.
* Fitur Search/Filter berdasarkan Topik.
* Status: "Learning" (Level 0-3) vs "Mastered" (Level 4+).

---

## 5. Why This is "Perfect"?

1. **Efisiensi Penyimpanan:** Kamu tidak menyimpan *semua* soal. Kamu hanya menyimpan apa yang **gagal** diproses otakmu pertama kali. Database tetap kecil, tapi bernilai tinggi.
2. **Interleaving Effect:** Karena semua topik (Go, React, SQL) masuk ke satu tabel `review_items`, saat Review harian, otakmu dipaksa *context switching*. Riset menunjukkan ini meningkatkan *problem solving skill* drastis dibanding belajar per blok.
3. **Zero Friction Setup:** Next.js Server Actions + Supabase berarti tidak ada setup server yang ribet. Kamu bisa fokus "mengisi konten" ke otakmu, bukan maintenance server.

---

## 6. Data Classification: What Gets Stored vs Discarded

Ini rincian pembagian datanya. Kuncinya adalah **Efisiensi**: Kita tidak menyimpan sampah, cuma menyimpan "emas" (materi yang kamu belum paham).

### 1. 🤖 AI Generated (Dinamis / Sekali Pakai)

*Ini adalah data yang dibuat oleh AI (Gemini/ChatGPT) saat kamu minta soal. Sifatnya **Ephemeral** (sementara), hanya lewat di aplikasi saat kamu mengerjakan kuis pertama kali.*

* **Konten Soal:** Teks pertanyaan ("What is a Goroutine?").
* **Pilihan Jawaban:** Option A, B, C, D.
* **Kunci Jawaban:** Jawaban yang benar.
* **Penjelasan (Explanation):** Alasan kenapa jawaban itu benar/salah.
* **Topik Spesifik:** Judul materi yang di-generate saat itu.

> **Nasib Data Ini:** Kalau kamu menjawab **BENAR**, semua data di atas **DIBUANG/LUPAKAN** oleh sistem. Tidak masuk database. Anggap saja angin lalu.

---

### 2. 🧱 Static (Hardcoded di Kode)

*Ini adalah bagian yang kamu tulis di kodingan (Next.js). Tidak berubah kecuali kamu update aplikasi.*

* **Prompt Templates:** Kalimat perintah ke AI agar outputnya format JSON.
  * *Contoh:* `"Create 5 MCQ questions about {topic}. Return raw JSON array..."`

* **Algoritma SRS (Leitner System):** Rumus matematika untuk menghitung kapan soal muncul lagi.
  * *Contoh:* Logic `if (rating == 'hard') next_date = now + 1 day`.

* **UI/Layout:** Tampilan kartu kuis, tombol, progress bar, animasi.
* **Kategori/Tipe Soal:** Enum (`MULTIPLE_CHOICE`, `OPEN_ENDED`).

---

### 3. 💾 Stored in System (Masuk Database Supabase)

*Ini adalah data yang **disimpan permanen**. Data ini hanya masuk sini JIKA DAN HANYA JIKA kamu melakukan kesalahan.*

* **The "Mistake" (Full JSON Object):**
  * Saat kamu salah jawab, sistem mengambil **seluruh paket data AI** (Pertanyaan + Pilihan + Jawaban Benar + Penjelasan) dari poin nomor 1, lalu menyimpannya mentah-mentah ke kolom `question_data` (tipe JSONB).

* **Metadata SRS:**
  * `srs_level`: Level pemahamanmu (0-5).
  * `next_review_at`: Tanggal & Jam spesifik kapan soal ini boleh muncul lagi.
  * `last_reviewed_at`: Kapan terakhir kamu review.

* **User Progress:**
  * `xp`: Poin pengalaman.
  * `streak`: Jumlah hari berturut-turut belajar.

---

### Rangkuman Flow Penyimpanan

| Komponen | Asal Data | Disimpan di DB? | Keterangan |
| --- | --- | --- | --- |
| **Pertanyaan Kuis** | AI (Gemini) | ❌ **TIDAK** (Jika Benar) | Dibuang setelah kuis selesai. |
| **Pertanyaan Sulit** | AI (Gemini) | ✅ **YA** (Jika Salah) | Disimpan lengkap untuk bahan review. |
| **Prompt Template** | Static Code | ❌ **TIDAK** | Ada di file `.ts` / `.js`. |
| **Jadwal Review** | Algoritma | ✅ **YA** | Disimpan sebagai `timestamp`. |
| **User XP/Level** | Logic App | ✅ **YA** | Update terus setiap aksi. |

Konsep ini bikin database kamu **kecil, cepat, dan murah**, tapi **bernilai tinggi** karena isinya cuma kelemahan-kelemahan kamu yang perlu diperbaiki.

---

## Next Step: Implementation Order

1. **Setup Database:** Jalankan SQL schema `review_items` di Supabase.
2. **Backend Logic:** Buat fungsi `saveMistake` (Logic Mode 1) di Next.js.
3. **UI Review:** Buat halaman `/review` yang menarik data hari ini.

Mau mulai copas SQL Schema-nya dulu ke Supabase?

---

# Hybrid Authentication Implementation

Keputusan yang tepat. Menyediakan **dua opsi** (Google OAuth & Email/Password) itu standar emas UX.

* **Google Auth:** Buat user yang malas ngetik (Satu klik, masuk).
* **Email/Pass:** Buat user yang lebih suka cara konvensional atau tidak pakai Google.

Karena kita pakai **Next.js + Supabase**, ini gampang banget. Supabase sudah menangani kerumitan "session" di belakang layar.

Berikut adalah **Blueprint Implementasi Hybrid Auth**:

---

## 1. Persiapan di Supabase Dashboard

Sebelum koding, nyalakan dulu fiturnya di dashboard project Supabase kamu:

1. Menu **Authentication** -> **Providers**.
2. **Email:** Pastikan "Enable Email Provider" aktif.
3. **Google:**
   * Aktifkan "Enable Google".
   * Masukkan `Client ID` dan `Client Secret` (Dapat dari Google Cloud Console).
   * *Tips:* Jangan lupa masukkan `Redirect URL` dari Supabase ke Google Console.

---

## 2. The Code (Next.js App Router)

Kita butuh 3 file utama: **Halaman Login (UI)**, **Server Actions (Logic)**, dan **Callback Route (Penyambung OAuth)**.

### A. Logic Login (`app/login/actions.ts`)

Kita pakai Server Actions biar aman dan code-nya bersih.

```typescript
'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'

// 1. Logic Login Biasa (Email & Password)
export async function login(formData: FormData) {
  const supabase = createClient()
  
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return redirect('/login?message=Gagal login, cek email/password')
  }

  return redirect('/') // Redirect ke dashboard kalau sukses
}

// 2. Logic Login Google (OAuth)
export async function loginWithGoogle() {
  const supabase = createClient()
  const origin = headers().get('origin')

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      // Penting: Redirect balik ke route handler kita setelah dari Google
      redirectTo: `${origin}/auth/callback`, 
    },
  })

  if (data.url) {
    redirect(data.url) // User "dilempar" ke halaman login Google
  }
}
```

### B. Handler OAuth (`app/auth/callback/route.ts`)

Ini file **WAJIB** kalau pakai Login Google di Next.js. File ini yang menangkap user setelah mereka klik "Allow" di Google dan menukar kodenya jadi session login.

```typescript
import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  
  if (code) {
    const supabase = createClient()
    // Tukar "code" dari Google menjadi Session user yang valid
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // Kalau sukses, lempar masuk ke aplikasi
      return NextResponse.redirect(`${origin}/`)
    }
  }

  // Kalau gagal, balikin ke login
  return NextResponse.redirect(`${origin}/login?message=Auth Error`)
}
```

### C. Tampilan (`app/login/page.tsx`)

Simple form dengan dua tombol.

```tsx
import { login, loginWithGoogle } from './actions'

export default function LoginPage({ searchParams }: { searchParams: { message: string } }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-md space-y-8 bg-white p-8 rounded-xl shadow-lg dark:bg-gray-800">
        
        <h2 className="text-2xl font-bold text-center">Masuk ke Inquizitive</h2>

        {/* Tombol Login Google */}
        <form action={loginWithGoogle}>
          <button className="w-full flex items-center justify-center gap-2 bg-white border border-gray-300 text-gray-700 py-2 rounded hover:bg-gray-50 transition">
             {/* Masukkan Icon Google SVG disini */}
             <span>Lanjut dengan Google</span>
          </button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center"><span className="w-full border-t"></span></div>
          <div className="relative flex justify-center text-sm"><span className="px-2 bg-white text-gray-500 dark:bg-gray-800">Atau email</span></div>
        </div>

        {/* Form Login Biasa */}
        <form className="space-y-4">
          <div>
            <label className="block text-sm font-medium">Email</label>
            <input name="email" type="email" required className="w-full p-2 border rounded mt-1 dark:bg-gray-700" />
          </div>
          <div>
            <label className="block text-sm font-medium">Password</label>
            <input name="password" type="password" required className="w-full p-2 border rounded mt-1 dark:bg-gray-700" />
          </div>
          
          {/* Panggil Server Action 'login' via formAction */}
          <button formAction={login} className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
            Masuk
          </button>
          
          {searchParams?.message && (
            <p className="text-red-500 text-sm text-center">{searchParams.message}</p>
          )}
        </form>

      </div>
    </div>
  )
}
```

---

## Kesimpulan

Dengan struktur ini:

1. **Google:** User klik -> Redirect ke Google -> Balik ke `/auth/callback` -> Masuk Dashboard.
2. **Email:** User ketik -> Klik "Masuk" -> Server Action cek password -> Masuk Dashboard.

Semuanya terintegrasi dengan tabel `auth.users` di Supabase. Tabel `review_items` (SRS) kita nanti tinggal pakai `user_id` dari login ini.

Siap copy-paste setup-nya?

---

# The Loop of Mastery

Ini adalah **"The Loop of Mastery"**. Flow ini didesain supaya kamu nggak cuma *mengerjakan* soal, tapi **menambal lubang** pengetahuanmu secara permanen.

Bayangkan ini seperti **RPG Game Loop**: *Grind (Cari Materi) -> Combat (Kuis) -> Loot (Simpan Kesalahan) -> Upgrade (Review).*

Berikut flow detailnya dari sisi **User (Kamu)** dan **System (Next.js + Supabase)**:

---

## 🔄 Phase 1: The Filter (Mencari Kelemahan)

*Tujuan: Memilah mana yang kamu SUDAH tahu vs BELUM tahu.*

1. **Trigger:** Kamu ingin belajar topik baru (misal: "Golang Concurrency").
2. **Action (Manual/External):**
   * Kamu minta ChatGPT/Gemini Web: *"Buatkan 10 soal sulit tentang Golang Concurrency, output raw JSON."*
   * Kamu **Copy JSON**-nya.

3. **Input (App):**
   * Masuk ke App -> Paste JSON -> Klik **"Start Quiz"**.

4. **The Combat (Pengerjaan):**
   * Kamu jawab 10 soal tersebut.
   * **Sistem:** Menilai jawabanmu secara real-time.

5. **The Filtering (Otomatis):**
   * **Jika Benar:** Soal dibuang/diabaikan. (Otakmu sudah tahu, ngapain menuhin database?).
   * **Jika Salah:** Sistem otomatis memanggil Server Action `saveMistake()`.
   * **Database:** Soal yang salah disimpan ke tabel `review_items` dengan status `Level 0` (New).

---

## 🧠 Phase 2: The Gym (Daily Review)

*Tujuan: Mengubah Short-term memory jadi Long-term memory (Neuroplasticity).*

1. **Trigger:** Kamu buka aplikasi di pagi hari/senggang.
2. **Dashboard:**
   * Sistem query ke Supabase: `SELECT * FROM review_items WHERE next_review_at <= NOW()`.
   * Kamu melihat notifikasi: **"5 Cards Due for Review"**.

3. **Action:** Klik **"Start Review"**.
4. **Review Loop:**
   * App menampilkan soal yang DULU kamu salah.
   * Kamu menjawab lagi.
   * Kamu memberi rating kejujuran (Self-Grading):
     * 🔴 **Lupa/Salah Lagi:** Reset ke hari ke-0.
     * 🟡 **Susah (Ingat dikit):** Muncul 1 hari lagi.
     * 🟢 **Mudah (Lancar):** Muncul 3 hari lagi.

5. **Database Update:**
   * Sistem menghitung tanggal baru berdasarkan algoritma SRS.
   * Update kolom `next_review_at` dan `srs_level` di Supabase.

---

## 🏆 Phase 3: Mastery (Kelulusan)

*Tujuan: Membersihkan "beban" pikiran.*

1. **Proses:** Sebuah soal terus dijawab **"Mudah" (🟢)** berkali-kali.
2. **Level Up:** Interval review makin lama (3 hari -> 7 hari -> 14 hari -> 1 bulan).
3. **Graduation:**
   * Saat soal mencapai `Level 5` (atau interval > 30 hari), sistem menandainya sebagai **MASTERED**.
   * Soal tidak akan muncul lagi di Daily Review (kecuali kamu cari di arsip).
   * **Reward:** XP bertambah drastis, status "Mastery" di dashboard naik.

---

## 🛠️ Visualisasi Data Flow (Technical)

```mermaid
graph TD
    A[User (External AI)] -->|Copy JSON| B(Next.js Frontend)
    B -->|Parse & Render| C{User Menjawab}
    C -->|Benar| D[Buang / Lupakan]
    C -->|Salah| E[Server Action: saveMistake]
    E -->|Insert| F[(Supabase: review_items)]
    
    G[Daily Cron / Dashboard] -->|Query: next_review_at <= NOW| F
    F -->|Fetch Soal| H(Review UI)
    H -->|User Jawab Ulang| I{Rating Kesulitan}
    
    I -->|Susah| J[Reset Interval]
    I -->|Mudah| K[Naikkan Interval (x2.5)]
    
    J -->|Update| F
    K -->|Update| F
```

---

## Kenapa Flow ini "Sempurna"?

1. **Hemat Waktu:** Kamu tidak me-review apa yang sudah kamu tahu. Kamu cuma fokus ke "lubang" di otakmu.
2. **Data Driven:** Kamu tidak belajar berdasarkan *perasaan* ("keknya gue udah bisa deh"), tapi berdasarkan **data** (kapan terakhir salah, kapan harus review).
3. **Lazy & Efficient:** Cukup "Copy-Paste-Jawab". Sisanya (penjadwalan, penyimpanan) diurus mesin.

**Gimana?** Flow ini sudah cukup jelas buat langsung di-coding? Bagian **Phase 1 (Filtering)** adalah langkah pertama kita.

---

# Missing Critical Features: Tech Interview Prep Essentials

Kalau kita lihat dari kacamata **"Tech Interview Prep"** dan **"Personal Learning System"**, ada 3 hal krusial yang masih bolong (missing) dari rencana kita sejauh ini.

Ini bukan sekadar fitur "pemanis", tapi fitur yang membedakan aplikasi "catatan biasa" dengan "mesin pencetak senior engineer".

---

## 1. Code Syntax Highlighting & Rendering (Wajib buat Tech)

Aplikasi kita isinya bakal penuh dengan potongan kode (Go, TypeScript, SQL). Kalau cuma nampilin teks polosan hitam-putih, otakmu bakal capek bacanya (*cognitive load* tinggi).

* **Yang Kurang:** Komponen buat render code block (````go ... ````) biar berwarna dan rapi.
* **Solusi:** Pakai library **`react-markdown`** + **`rehype-highlight`** (atau `shiki` kalau mau lebih cantik).
* **Kenapa Penting?** Interview teknikal seringkali soalnya: *"Apa output kode ini?"* atau *"Temukan bug di snippet ini"*. Mata harus dilatih baca pattern kode, bukan teks.

---

## 2. "Heatmap" Consistency Tracker (Github Style)

Kamu bilang butuh motivasi (*gamification*). Angka XP saja kadang membosankan.

* **Yang Kurang:** Visualisasi konsistensi. Otak developer sangat terpacu kalau melihat kotak-kotak hijau ala GitHub.
* **Solusi:** Buat komponen **Contribution Graph** di Dashboard.
* Setiap kali kamu menyelesaikan Review SRS atau menambah soal baru -> Kotak hari ini jadi hijau.
* *Psychological Effect:* "Don't break the chain." Kamu bakal merasa bersalah kalau ada bolong abu-abu di kalendermu.

---

## 3. Tagging & Topic Grouping

Sekarang skema kita menyimpan soal di satu tabel besar. Nanti kalau soalmu sudah 500 biji, bakal berantakan.

* **Yang Kurang:** Cara mengelompokkan kelemahan.
* **Solusi:** Tambahkan kolom `tags` (array of string) di tabel `review_items`.
* Contoh Tags: `["Golang", "Concurrency", "Backend"]` atau `["System Design", "Load Balancer"]`.

* **Fitur:** Nanti di halaman Review, kamu bisa pilih: *"Hari ini aku cuma mau review topik **Golang** saja"* (Focused Review).

---

## Rangkuman "To-Do List" Tambahan

Ini daftar belanja library/komponen yang perlu kamu pasang di Next.js nanti:

| Fitur | Library Rekomendasi | Kegunaan |
| --- | --- | --- |
| **Code Highlighting** | `react-syntax-highlighter` atau `shiki` | Supaya snippet code di soal/jawaban berwarna (VS Code style). |
| **Markdown Rendering** | `react-markdown` | Supaya penjelasan AI yang pakai **bold**, *italic*, dan list terbaca rapi. |
| **Heatmap** | `react-calendar-heatmap` | Visualisasi "Streak" belajar ala GitHub di Dashboard. |
| **Toast/Notif** | `sonner` (sudah kamu sebut) | Feedback instan pas copy/paste/save. |

---

## Database Schema Update: Adding Tags

Perlu update schema `review_items` untuk mendukung tagging:

```sql
-- Update existing table
ALTER TABLE review_items 
ADD COLUMN tags text[] DEFAULT ARRAY[]::text[];

-- Create index for faster tag filtering
CREATE INDEX idx_review_items_tags ON review_items USING GIN(tags);
```

---

# Advanced Cognitive Learning: From 80% to 100% Mastery

Kalau tujuanmu adalah **"Groking"** (pemahaman mendalam yang intuitif) dan benar-benar memeras otak (*cognitive maximalism*), sistem SRS (Spaced Repetition) + Active Recall yang kita bahas tadi itu baru **80%**. Itu fondasinya.

Untuk mencapai **100% (God Tier Learning)**, kamu perlu menyuntikkan 3 metode psikologi kognitif tambahan ke dalam aplikasimu. Ini bedanya "hafal" sama "paham di luar kepala".

Berikut adalah fitur tambahan ("DLC") untuk membedah otakmu:

---

## 1. The Feynman Technique (Implementation: "Explain Like I'm 5")

Hafal jawaban `C` itu gampang. Tapi bisa menjelaskan *kenapa* `C` benar dan `B` salah itu level lain.

* **Konsep:** Kamu belum paham kalau belum bisa menjelaskannya dengan bahasa sederhana.
* **Fitur App:** Tambahkan mode **"Journaling/Explain"**.
* Jangan cuma klik pilihan ganda.
* Tambahkan satu input box wajib: **"Why?"**
* **Logic:** Sebelum tombol "Submit" aktif, user harus mengetik minimal 1 kalimat alasan kenapa dia pilih itu.
* **AI Validator:** Kirim alasanmu ke Gemini. Biar Gemini yang nilai: *"Penjelasanmu benar tapi terlalu berbelit"* atau *"Jawabanmu benar, tapi alasanmu salah (lucky guess)"*.

---

## 2. The Generation Effect (Implementation: "Hardcore Mode")

Riset menunjukkan kalau kita **menebak dulu sebelum dikasih tahu pilihannya**, memori kita 2x lebih kuat.

* **Konsep:** Otak harus dipaksa mencari data di arsip memori *sebelum* dikasih bantuan visual (pilihan ganda).
* **Fitur App:** **Blurry Options**.
* Saat soal muncul, **sembunyikan pilihan A, B, C, D**.
* User harus baca soal -> Mikir jawabannya di kepala -> Klik tombol "Show Options" -> Baru pilih.
* Ini mencegah "Process of Elimination" (menjawab benar karena pilihan lain jelas salah), yang sebenarnya adalah *fake learning*.

---

## 3. Concrete Practice (Implementation: "Scenario Based")

Syntax itu abstrak. Otak manusia benci abstrak. Otak suka cerita/kasus.

* **Konsep:** Jangan tanya *"Apa itu Mutex?"*. Tanyalah *"Server e-commerce ini crash karena race condition saat flash sale. Mana baris code yang harus dipasang Mutex?"*
* **Fitur App:** **Prompt Engineering**.
* Ubah prompt template ke AI kamu. Jangan cuma minta "Quiz".
* Minta: *"Generate questions based on **Real World Production Failure Scenarios**."*
* Ini melatih insting *debug* dan *system design*, bukan cuma insting kamus.

---

## 🔥 Master Plan: The "Deep Work" Flow

Jadi, kalau mau *groking* maksimal, flow belajarmu di aplikasi nanti begini:

### Stage 1: The Struggle (Generation Effect)

* Soal muncul. Pilihan jawaban **disembunyikan**.
* Kamu dipaksa menebak solusinya di otak (atau corat-coret di kertas).

### Stage 2: The Verification (Active Recall)

* Klik "Show Options".
* Pilih jawaban yang paling cocok sama tebakanmu.

### Stage 3: The Teaching (Feynman Technique)

* *Opsional tapi sangat disarankan:* Ketik singkat *kenapa* itu jawabannya di kolom input "Why".
* Misal: *"Karena Goroutine itu lightweight thread, kalau gak pake WaitGroup main function keburu exit sebelum goroutine jalan."*

### Stage 4: The Feedback (AI Judge)

* Submit.
* AI bilang: "Jawaban Benar. Penjelasanmu Akurat." -> **Dopamine Hit!** 🚀
* Masuk ke SRS database kalau salah.

---

## UI Implementation: "Hardcore Mode" Toggle

Tambahkan switch di settings atau quiz mode:

```tsx
// Component: QuizSettings.tsx
<div className="flex items-center justify-between">
  <label>Hardcore Mode (Blur Options)</label>
  <Switch 
    isSelected={isHardcoreMode}
    onValueChange={setIsHardcoreMode}
  />
</div>

<div className="flex items-center justify-between">
  <label>Require Explanation (Feynman)</label>
  <Switch 
    isSelected={requireExplanation}
    onValueChange={setRequireExplanation}
  />
</div>
```

**Flow Logic:**
- Jika `isHardcoreMode === true`: Pilihan jawaban disembunyikan sampai user klik "Show Options".
- Jika `requireExplanation === true`: Input "Why?" wajib diisi sebelum submit.

---

## Prompt Template Update: Scenario-Based Questions

Update prompt template di `constants/prompts.ts`:

```typescript
export const PROMPT_TEMPLATES = {
  SCENARIO_BASED: (topic: string) => `
    Generate 10 multiple choice questions about ${topic} based on:
    1. Real-world production failure scenarios
    2. Debugging challenges from actual codebases
    3. System design trade-offs in practice
    
    Each question should present a concrete scenario/problem, not abstract definitions.
    Example: Instead of "What is a race condition?", ask "Your e-commerce API 
    returns incorrect inventory counts during flash sales. Which synchronization 
    primitive should you use?"
  `
}
```

---

## Kesimpulan

Metode **SRS** menjaga ingatan biar gak hilang.
Metode **Feynman & Generation** memastikan ingatan itu **berkualitas tinggi**.

Kalau kamu implementasi fitur **"Blur Options"** (sembunyikan jawaban di awal) dan **"Scenario Based Prompts"**, itu sudah cukup untuk bikin otakmu "panas" (dalam arti bagus) setiap sesi belajar.

Gimana? Siap nambahin fitur "Show/Hide Options" di UI-nya?

---

## Cek Final Flow

Apakah ada yang masih membingungkan? Atau kita sudah punya **"Master Plan"** yang cukup lengkap buat mulai coding?

1. **Stack:** Next.js + Supabase.
2. **Auth:** Google + Email.
3. **Core:** Copy-Paste AI JSON -> Quiz -> Save Mistakes to DB.
4. **Review:** SRS Algorithm (Spaced Repetition).
5. **UI:** Code Highlighter + Heatmap.
6. **Organization:** Tagging & Topic Grouping.

Kalau sudah oke, **langkah pertamamu** adalah: **Init Project Next.js & Setup Supabase**.
Mau dipandu command line-nya?

// ============================================================
// SINKRONISASI DATA KE SUPABASE
// File ini TIDAK mengubah cara kerja dashboard.js sama sekali.
// Yang dilakukan:
// 1. Sebelum dashboard.js dimuat, ambil data terbaru dari Supabase
//    dan isikan ke localStorage (persis seperti Upload Backup).
// 2. Setiap kali dashboard.js menyimpan data ke localStorage untuk
//    3 kunci penting (dataPasienPulang, konfigTTDepartemen,
//    jumlahTempatTidurRS), otomatis dikirim juga ke Supabase.
// ============================================================

(function () {
  const SUPABASE_URL = 'https://trjrvkadjxbgvenrbmxe.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRyanJ2a2FkanhiZ3ZlbnJibXhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYyMDEzOTgsImV4cCI6MjEwMTc3NzM5OH0.dLo5VyuzrR8KA1JPt7OPgkptm8RqG7hvTzqyLm_7fTI';
  const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  const KUNCI_SYNC = ['dataPasienPulang', 'konfigTTDepartemen', 'jumlahTempatTidurRS'];
  const ID_DATA = 'main';

  // ===== KIRIM DATA KE SUPABASE (dijadwalkan otomatis) =====
  let timerSimpan = null;
  function jadwalkanSimpanKeSupabase() {
    clearTimeout(timerSimpan);
    timerSimpan = setTimeout(async () => {
      const payload = {};
      KUNCI_SYNC.forEach(kunci => {
        const nilai = localStorage.getItem(kunci);
        if (nilai !== null) {
          try { payload[kunci] = JSON.parse(nilai); }
          catch (e) { payload[kunci] = nilai; }
        }
      });
      try {
        const { error } = await supabaseClient
          .from('app_data')
          .upsert({ id: ID_DATA, payload, updated_at: new Date().toISOString() });
        if (error) console.error('[Supabase] Gagal menyimpan:', error);
        else console.log('[Supabase] Data tersinkron ke cloud.');
      } catch (err) {
        console.error('[Supabase] Gagal terhubung:', err);
      }
    }, 800);
  }

  // Sadap localStorage.setItem/removeItem supaya dashboard.js TIDAK perlu
  // diubah sama sekali — begitu salah satu dari 3 kunci penting berubah,
  // otomatis dikirim ke Supabase di belakang layar.
  const setItemAsli = localStorage.setItem.bind(localStorage);
  localStorage.setItem = function (key, value) {
    setItemAsli(key, value);
    if (KUNCI_SYNC.includes(key)) jadwalkanSimpanKeSupabase();
  };
  const removeItemAsli = localStorage.removeItem.bind(localStorage);
  localStorage.removeItem = function (key) {
    removeItemAsli(key);
    if (KUNCI_SYNC.includes(key)) jadwalkanSimpanKeSupabase();
  };

  // ===== AMBIL DATA DARI SUPABASE, BARU MUAT dashboard.js =====
  async function muatDanJalankanDashboard() {
    try {
      const { data, error } = await supabaseClient
        .from('app_data')
        .select('payload')
        .eq('id', ID_DATA)
        .maybeSingle();

      if (error) {
        console.error('[Supabase] Gagal mengambil data:', error);
      } else if (data && data.payload) {
        KUNCI_SYNC.forEach(kunci => {
          const nilai = data.payload[kunci];
          if (nilai !== undefined) {
            setItemAsli(kunci, typeof nilai === 'string' ? nilai : JSON.stringify(nilai));
          }
        });
        console.log('[Supabase] Data terbaru dimuat dari cloud.');
      }
    } catch (err) {
      console.error('[Supabase] Gagal terhubung, memakai data lokal (kalau ada):', err);
    }

    // Baru sekarang muat dashboard.js, setelah localStorage terisi data
    // terbaru dari Supabase.
    const script = document.createElement('script');
    script.src = 'dashboard.js';
    document.body.appendChild(script);
  }

  muatDanJalankanDashboard();
})();

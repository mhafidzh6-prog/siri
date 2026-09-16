if (localStorage.getItem('isLoggedIn') !== 'true') {
  window.location.href = 'index.html';
}

document.getElementById('namaUser').textContent = localStorage.getItem('namaPetugas') || 'Petugas';

document.getElementById('logoutBtn').addEventListener('click', function () {
  localStorage.removeItem('isLoggedIn');
  localStorage.removeItem('namaPetugas');
  window.location.href = 'index.html';
});

document.querySelectorAll('.menu-item').forEach(function (btn) {
  btn.addEventListener('click', function () {
    pindahMenu(btn.dataset.view);
  });
});

function pindahMenu(viewId) {
  document.querySelectorAll('.menu-item').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.view').forEach(v => v.style.display = 'none');
  const btn = document.querySelector(`.menu-item[data-view="${viewId}"]`);
  if (btn) btn.classList.add('active');
  document.getElementById(viewId).style.display = 'block';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function renderBeranda() {
  const data = ambilDataPasien();
  const aktif = data.filter(p => !p.tglKeluar).length;
  const pulang = data.filter(p => p.tglKeluar);
  const lengkap = pulang.filter(p => p.diagnosa.length > 0).length;
  document.getElementById('statTotalPasien').textContent = data.length;
  document.getElementById('statPasienAktif').textContent = aktif;
  document.getElementById('statDiagnosaLengkap').textContent = lengkap;
  document.getElementById('statDiagnosaBelum').textContent = pulang.length - lengkap;
  perbaruiInfoTempatTidurKosong();
  renderBarisMortalitas();
}

function hitungTempatTidurKosong() {
  const totalTT = Number(localStorage.getItem(KUNCI_TT_RS)) || 0;
  const pasienAktif = ambilDataPasien().filter(p => !p.tglKeluar).length;
  const kosong = totalTT > 0 ? Math.max(totalTT - pasienAktif, 0) : null;
  return { totalTT, pasienAktif, kosong };
}

function perbaruiInfoTempatTidurKosong() {
  const { totalTT, pasienAktif, kosong } = hitungTempatTidurKosong();

  const statEl = document.getElementById('statTTKosong');
  if (statEl) statEl.textContent = kosong !== null ? kosong : '-';

  const teksInfo = totalTT > 0
    ? `Kapasitas: ${totalTT} tempat tidur. Sedang dirawat: ${pasienAktif}. Kosong: ${kosong}.`
    : 'Atur dulu jumlah tempat tidur total di atas.';

  const infoBeranda = document.getElementById('infoTTKosongBeranda');
  if (infoBeranda) infoBeranda.textContent = teksInfo;

  const infoSensus = document.getElementById('infoTTKosongSensus');
  if (infoSensus) infoSensus.textContent = totalTT > 0
    ? `Kapasitas: ${totalTT} tempat tidur.`
    : 'Atur dulu jumlah tempat tidur total di Beranda.';

  if (totalTT > 0) {
    const sensusEl = document.getElementById('sensusTempatTidur');
    if (sensusEl && sensusEl.value === '') sensusEl.value = totalTT;
    const indikatorEl = document.getElementById('tempatTidur');
    if (indikatorEl && indikatorEl.value === '') indikatorEl.value = totalTT;
  }
}

const KUNCI_TT_RS = 'jumlahTempatTidurRS';

function muatPengaturanTT() {
  const nilai = localStorage.getItem(KUNCI_TT_RS);
  if (!nilai) return;
  document.getElementById('pengaturanTT').value = nilai;
  perbaruiInfoTempatTidurKosong();
}

document.getElementById('btnSimpanPengaturanTT').addEventListener('click', function () {
  const v = Number(document.getElementById('pengaturanTT').value);
  if (!v || v < 1) {
    alert('Isi jumlah tempat tidur dengan angka yang valid (minimal 1).');
    return;
  }
  localStorage.setItem(KUNCI_TT_RS, v);
  perbaruiInfoTempatTidurKosong();
  alert('Pengaturan kapasitas tempat tidur total tersimpan: ' + v + '. Kolom "Jumlah Tempat Tidur" di Sensus Otomatis dan Indikator Rawat Inap akan otomatis memakai angka ini (kalau kolomnya masih kosong).');
});

const KUNCI_LAST_INDIKATOR = 'lastIndikatorInput';

['tempatTidur', 'periode', 'hariPerawatan', 'lamaDirawat', 'pasienKeluar'].forEach(id => {
  document.getElementById(id).addEventListener('input', function () {
    const infoUsang = document.getElementById('infoHasilUsang');
    if (infoUsang && document.getElementById('hasilSection').style.display !== 'none') {
      infoUsang.style.display = 'block';
    }
  });
});

function perbaruiPeriodeDariTanggalIndikator() {
  const awalEl = document.getElementById('periodeIndAwal');
  const akhirEl = document.getElementById('periodeIndAkhir');
  const infoEl = document.getElementById('infoPeriodeInd');
  const periodeEl = document.getElementById('periode');
  if (!awalEl || !akhirEl) return;

  const awal = awalEl.value, akhir = akhirEl.value;
  if (!awal || !akhir) {
    if (infoEl) infoEl.textContent = '';
    periodeEl.readOnly = false;
    return;
  }
  if (new Date(akhir) < new Date(awal)) {
    if (infoEl) infoEl.textContent = 'Periode Akhir tidak boleh sebelum Periode Awal.';
    return;
  }
  const jumlahHari = Math.round((new Date(akhir + 'T00:00:00') - new Date(awal + 'T00:00:00')) / 86400000) + 1;
  periodeEl.value = jumlahHari;
  periodeEl.readOnly = true;
  if (infoEl) infoEl.textContent = `Otomatis: ${jumlahHari} hari kalender (${awal} s/d ${akhir}). Kosongkan salah satu tanggal untuk kembali isi manual.`;
  const infoUsang = document.getElementById('infoHasilUsang');
  const hasilSectionEl = document.getElementById('hasilSection');
  if (infoUsang && hasilSectionEl && hasilSectionEl.style.display !== 'none') {
    infoUsang.style.display = 'block';
  }
}
document.getElementById('periodeIndAwal')?.addEventListener('change', perbaruiPeriodeDariTanggalIndikator);
document.getElementById('periodeIndAkhir')?.addEventListener('change', perbaruiPeriodeDariTanggalIndikator);

document.getElementById('hitungForm').addEventListener('submit', function (e) {
  e.preventDefault();

  const tempatTidur = Number(document.getElementById('tempatTidur').value);
  const periode = Number(document.getElementById('periode').value);
  const hariPerawatan = Number(document.getElementById('hariPerawatan').value);
  const lamaDirawat = Number(document.getElementById('lamaDirawat').value);
  const pasienKeluar = Number(document.getElementById('pasienKeluar').value);

  if (!tempatTidur) {
    alert('Jumlah Tempat Tidur masih 0 atau belum diisi. Cek Beranda > Pengaturan Tempat Tidur Rumah Sakit, atau isi manual kolom "Jumlah Tempat Tidur" di form ini.');
    return;
  }

  if (pasienKeluar === 0) {
    alert('Jumlah pasien keluar tidak boleh 0.');
    return;
  }

  const bor = (hariPerawatan / (tempatTidur * periode)) * 100;
  const avlos = lamaDirawat / pasienKeluar;
  const toi = ((tempatTidur * periode) - hariPerawatan) / pasienKeluar;
  const bto = pasienKeluar / tempatTidur;
  const btoTahunan = bto * (365 / periode);

  document.getElementById('borHasil').textContent = bor.toFixed(2) + '%';
  document.getElementById('avlosHasil').textContent = avlos.toFixed(2) + ' hari';
  document.getElementById('toiHasil').textContent = toi.toFixed(2) + ' hari';
  document.getElementById('btoHasil').textContent = bto.toFixed(2) + ' kali (≈' + btoTahunan.toFixed(1) + '/thn)';

  setStatusKotak('borBox', bor >= 60 && bor <= 85);
  setStatusKotak('avlosBox', avlos >= 6 && avlos <= 9);
  setStatusKotak('toiBox', toi >= 1 && toi <= 3);
  setStatusKotak('btoBox', btoTahunan >= 40 && btoTahunan <= 50);

  document.getElementById('hasilSection').style.display = 'block';
  document.getElementById('grafikSection').style.display = 'block';
  document.getElementById('infoHasilUsang').style.display = 'none';

  gambarGrafikBarberJohnson(toi, avlos, bor, btoTahunan);

  localStorage.setItem(KUNCI_LAST_INDIKATOR, JSON.stringify({ tempatTidur, periode, hariPerawatan, lamaDirawat, pasienKeluar }));

  document.getElementById('hasilSection').scrollIntoView({ behavior: 'smooth' });
});

function setStatusKotak(idBox, isIdeal) {
  const box = document.getElementById(idBox);
  box.classList.remove('ideal', 'tidak-ideal');
  box.classList.add(isIdeal ? 'ideal' : 'tidak-ideal');
}

document.getElementById('btnCetakIndikator').addEventListener('click', function () {
  const rows = [
    ['BOR', document.getElementById('borHasil').textContent, '60% - 85%'],
    ['AvLOS', document.getElementById('avlosHasil').textContent, '6 - 9 hari'],
    ['TOI', document.getElementById('toiHasil').textContent, '1 - 3 hari'],
    ['BTO', document.getElementById('btoHasil').textContent, '40 - 50 kali/thn'],
  ];
  let tableHtml = '<table class="hasil-table"><tr><th>Indikator</th><th>Nilai</th><th>Standar Ideal</th></tr>';
  rows.forEach(r => tableHtml += `<tr><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td></tr>`);
  tableHtml += '</table>';
  const areaCetak = document.getElementById('areaCetak');
  areaCetak.innerHTML = `
    <h2>Hasil Perhitungan Indikator Rawat Inap</h2>
    ${tableHtml}
    <p class="catatan-pdf">Tips: pada jendela cetak, pilih tujuan "Simpan sebagai PDF" untuk menyimpan file PDF-nya.</p>
  `;
  window.print();
});

function gambarGrafikBarberJohnson(toi, avlos, bor, btoTahunan) {
  const BOR_MIN = 60, BOR_MAX = 85;
  const BTO_MIN = 40, BTO_MAX = 50;

  function titikDariBorBto(borPersen, btoTahun) {
    const slope = (borPersen / 100) / (1 - borPersen / 100);
    const jumlah = 365 / btoTahun;
    const t = jumlah / (1 + slope);
    const a = slope * t;
    return { toi: t, avlos: a };
  }

  const V1 = titikDariBorBto(BOR_MIN, BTO_MAX);
  const V2 = titikDariBorBto(BOR_MIN, BTO_MIN);
  const V3 = titikDariBorBto(BOR_MAX, BTO_MIN);
  const V4 = titikDariBorBto(BOR_MAX, BTO_MAX);

  const lebar = 600, tinggi = 420, margin = 50;

  const semuaToi = [toi, V1.toi, V2.toi, V3.toi, V4.toi];
  const semuaAvlos = [avlos, V1.avlos, V2.avlos, V3.avlos, V4.avlos];
  const maxToi = Math.max(...semuaToi) + 2;
  const maxAvlos = Math.max(...semuaAvlos) + 2;

  function posX(t) { return margin + (t / maxToi) * (lebar - margin * 1.5); }
  function posY(a) { return tinggi - margin - (a / maxAvlos) * (tinggi - margin * 1.5); }

  let gridlines = '';
  const jumlahGrid = 6;
  for (let i = 0; i <= jumlahGrid; i++) {
    const nx = (maxToi / jumlahGrid) * i;
    const x = posX(nx);
    gridlines += `<line x1="${x}" y1="${tinggi - margin}" x2="${x}" y2="20" stroke="#eee" stroke-width="1"/>`;
    gridlines += `<text x="${x}" y="${tinggi - margin + 18}" text-anchor="middle" font-size="10" fill="#999">${Math.round(nx)}</text>`;
    const ny = (maxAvlos / jumlahGrid) * i;
    const y = posY(ny);
    gridlines += `<line x1="${margin}" y1="${y}" x2="${lebar - 20}" y2="${y}" stroke="#eee" stroke-width="1"/>`;
    gridlines += `<text x="${margin - 8}" y="${y + 4}" text-anchor="end" font-size="10" fill="#999">${Math.round(ny)}</text>`;
  }

  const polyPoints = [V1, V2, V3, V4].map(v => `${posX(v.toi)},${posY(v.avlos)}`).join(' ');

  function ujungGarisBor(borPersen) {
    const slope = (borPersen / 100) / (1 - borPersen / 100);
    let x = maxToi, y = slope * x;
    if (y > maxAvlos) { y = maxAvlos; x = maxAvlos / slope; }
    return { x: posX(x), y: posY(y) };
  }
  const ujungBorMin = ujungGarisBor(BOR_MIN);
  const ujungBorMax = ujungGarisBor(BOR_MAX);

  function garisBto(btoTahun) {
    const jumlah = 365 / btoTahun;
    const x1 = Math.max(0, jumlah - maxAvlos);
    const y1 = jumlah - x1;
    const x2 = Math.min(maxToi, jumlah);
    const y2 = jumlah - x2;
    return { x1: posX(x1), y1: posY(y1), x2: posX(x2), y2: posY(y2) };
  }
  const garisBtoMin = garisBto(BTO_MIN);
  const garisBtoMax = garisBto(BTO_MAX);

  const titikX = posX(toi);
  const titikY = posY(avlos);
  const masukIdeal = (bor >= BOR_MIN && bor <= BOR_MAX && btoTahunan >= BTO_MIN && btoTahunan <= BTO_MAX);
  const warnaTitik = masukIdeal ? '#2e7d32' : '#d32f2f';

  const labelDiKanan = titikX < (lebar - 160);
  const labelX = labelDiKanan ? titikX + 12 : titikX - 12;
  const labelAnchor = labelDiKanan ? 'start' : 'end';

  const svg = `
    <svg viewBox="0 0 ${lebar} ${tinggi}" style="width:100%; height:auto; font-family:'Segoe UI',Arial;">
      ${gridlines}
      <polygon points="${polyPoints}" fill="#4caf50" fill-opacity="0.25" stroke="#2e7d32" stroke-width="1.5"/>
      <line x1="${posX(0)}" y1="${posY(0)}" x2="${ujungBorMin.x}" y2="${ujungBorMin.y}" stroke="#1565c0" stroke-width="1.3" stroke-dasharray="5,3"/>
      <text x="${Math.min(ujungBorMin.x + 4, lebar - 50)}" y="${ujungBorMin.y}" font-size="10" fill="#1565c0">BOR ${BOR_MIN}%</text>
      <line x1="${posX(0)}" y1="${posY(0)}" x2="${ujungBorMax.x}" y2="${ujungBorMax.y}" stroke="#1565c0" stroke-width="1.3" stroke-dasharray="5,3"/>
      <text x="${Math.min(ujungBorMax.x + 4, lebar - 50)}" y="${ujungBorMax.y}" font-size="10" fill="#1565c0">BOR ${BOR_MAX}%</text>
      <line x1="${garisBtoMin.x1}" y1="${garisBtoMin.y1}" x2="${garisBtoMin.x2}" y2="${garisBtoMin.y2}" stroke="#f57c00" stroke-width="1.3" stroke-dasharray="5,3"/>
      <text x="${garisBtoMin.x2 - 4}" y="${garisBtoMin.y2 - 6}" text-anchor="end" font-size="10" fill="#f57c00">BTO ${BTO_MIN}/thn</text>
      <line x1="${garisBtoMax.x1}" y1="${garisBtoMax.y1}" x2="${garisBtoMax.x2}" y2="${garisBtoMax.y2}" stroke="#f57c00" stroke-width="1.3" stroke-dasharray="5,3"/>
      <text x="${garisBtoMax.x2 - 4}" y="${garisBtoMax.y2 - 6}" text-anchor="end" font-size="10" fill="#f57c00">BTO ${BTO_MAX}/thn</text>
      <line x1="${margin}" y1="${tinggi - margin}" x2="${lebar - 20}" y2="${tinggi - margin}" stroke="#333" stroke-width="1.5"/>
      <line x1="${margin}" y1="${tinggi - margin}" x2="${margin}" y2="20" stroke="#333" stroke-width="1.5"/>
      <text x="${lebar / 2}" y="${tinggi - 10}" text-anchor="middle" font-size="13" fill="#333">TOI (hari)</text>
      <text x="15" y="${tinggi / 2}" text-anchor="middle" font-size="13" fill="#333" transform="rotate(-90, 15, ${tinggi / 2})">AvLOS (hari)</text>
      <circle cx="${titikX}" cy="${titikY}" r="7" fill="${warnaTitik}" stroke="white" stroke-width="2"/>
      <text x="${labelX}" y="${titikY - 10}" text-anchor="${labelAnchor}" font-size="11" fill="${warnaTitik}" font-weight="bold">BOR:${Math.round(bor)}% AvLOS:${Math.round(avlos)}</text>
      <text x="${labelX}" y="${titikY + 20}" text-anchor="${labelAnchor}" font-size="11" fill="${warnaTitik}" font-weight="bold">TOI:${Math.round(toi)} BTO:${Math.round(btoTahunan)}/thn</text>
    </svg>
  `;

  document.getElementById('grafikContainer').innerHTML = svg;

  const keterangan = masukIdeal
    ? '<p style="color:#2e7d32; font-weight:600; margin-top:12px;">✓ Titik berada di dalam area efisien — sesuai standar Depkes RI.</p>'
    : '<p style="color:#d32f2f; font-weight:600; margin-top:12px;">✗ Titik berada di luar area efisien — perlu evaluasi lebih lanjut.</p>';
  document.getElementById('grafikContainer').innerHTML += keterangan;

  const infoTitikEl = document.getElementById('infoTitikGrafik');
  if (infoTitikEl) {
    infoTitikEl.textContent = `Titik koordinat data ini: TOI (sumbu-X) = ${Math.round(toi)} hari, AvLOS (sumbu-Y) = ${Math.round(avlos)} hari — digambar sebagai titik bulat merah/hijau pada grafik di atas (bukan bagian dari arsiran). Area segi-empat hijau yang diarsir hanyalah batas ideal (BOR 60–85%, BTO 40–50 kali/tahun); titik data bisa jatuh di luar arsiran itu kalau nilainya di luar standar.`;
  }
}

function ambilRingkasanMortalitasPerTahun() {
  const data = ambilDataPasien().filter(p => p.tglKeluar);
  const perTahun = {};
  data.forEach(p => {
    const tahun = p.tglKeluar.slice(0, 4);
    if (!perTahun[tahun]) perTahun[tahun] = { tahun, keluar: 0, mati48kurang: 0, mati48lebih: 0 };
    perTahun[tahun].keluar++;
    if (p.keadaanKeluar === 'mati_kurang48') perTahun[tahun].mati48kurang++;
    if (p.keadaanKeluar === 'mati_lebih48') perTahun[tahun].mati48lebih++;
  });
  return Object.values(perTahun).sort((a, b) => a.tahun.localeCompare(b.tahun));
}

function renderBarisMortalitas() {
  const container = document.getElementById('mortalitasInputList');
  const ringkasan = ambilRingkasanMortalitasPerTahun();

  let html = '<div class="mortalitas-row-input" style="font-weight:600; font-size:12px; color:#666;"><span>Tahun</span><span>Pasien Keluar (Hidup+Mati)</span><span>Mati &lt; 48 Jam</span><span>Mati &ge; 48 Jam</span></div>';

  const JUMLAH_BARIS_MANUAL_TAMBAHAN = 2;
  const totalBaris = Math.max(ringkasan.length + JUMLAH_BARIS_MANUAL_TAMBAHAN, 5);

  for (let i = 0; i < totalBaris; i++) {
    const d = ringkasan[i];
    if (d) {
      html += `
        <div class="mortalitas-row-input data-row">
          <input type="text" class="m-tahun" value="${d.tahun}" readonly style="background:#eef3f6;" title="Otomatis dari data pasien tahun ${d.tahun}">
          <input type="number" class="m-keluar" value="${d.keluar}" readonly style="background:#eef3f6;">
          <input type="number" class="m-mati48kurang" value="${d.mati48kurang}" readonly style="background:#eef3f6;">
          <input type="number" class="m-mati48lebih" value="${d.mati48lebih}" readonly style="background:#eef3f6;">
        </div>
      `;
    } else {
      html += `
        <div class="mortalitas-row-input data-row">
          <input type="text" class="m-tahun" placeholder="contoh: tahun lama, misal 2023">
          <input type="number" class="m-keluar" placeholder="jumlah pasien keluar" min="0">
          <input type="number" class="m-mati48kurang" placeholder="mati < 48 jam" min="0">
          <input type="number" class="m-mati48lebih" placeholder="mati >= 48 jam" min="0">
        </div>
      `;
    }
  }
  container.innerHTML = html;

  const infoEl = document.getElementById('infoSumberMortalitas');
  if (infoEl) {
    infoEl.textContent = ringkasan.length > 0
      ? `Baris abu-abu (${ringkasan.map(r => r.tahun).join(', ')}) otomatis dihitung dari data pasien pulang di "Data Pasien" — tidak perlu diisi manual. Baris putih kosong bisa diisi manual kalau kamu punya data tahun-tahun lama (misalnya dari laporan RL1/arsip lama) yang belum dimasukkan sebagai data pasien di sistem ini.`
      : 'Belum ada data pasien pulang yang tercatat. Isi dulu data pasien (dengan Tanggal Masuk & Tanggal Keluar) di Langkah 1, atau isi manual di bawah kalau punya data dari laporan lama.';
  }
}

document.getElementById('mortalitasForm').addEventListener('submit', function (e) {
  e.preventDefault();

  const rows = [];
  document.querySelectorAll('#mortalitasInputList .data-row').forEach(rowEl => {
    const tahun = rowEl.querySelector('.m-tahun').value.trim();
    const keluar = Number(rowEl.querySelector('.m-keluar').value) || 0;
    const mati48kurang = Number(rowEl.querySelector('.m-mati48kurang').value) || 0;
    const mati48lebih = Number(rowEl.querySelector('.m-mati48lebih').value) || 0;
    if (tahun !== '' && keluar > 0) {
      rows.push({ tahun, keluar, mati48kurang, mati48lebih });
    }
  });
  rows.sort((a, b) => a.tahun.localeCompare(b.tahun));

  if (rows.length < 2) {
    alert('Isi minimal 2 tahun data (Tahun dan Jumlah Pasien Keluar wajib terisi) agar trend bisa dihitung.');
    return;
  }

  rows.forEach(r => {
    const totalMati = r.mati48kurang + r.mati48lebih;
    r.gdr = (totalMati / r.keluar) * 1000;
    r.ndr = (r.mati48lebih / r.keluar) * 1000;
  });

  let tabelHtml = '<tr><th>Tahun</th><th>GDR (‰)</th><th>Standar GDR</th><th>Analisa GDR</th><th>NDR (‰)</th><th>Standar NDR</th><th>Analisa NDR</th></tr>';
  rows.forEach(r => {
    const statusGdr = r.gdr <= 45 ? 'Baik' : 'Belum Baik';
    const statusNdr = r.ndr <= 25 ? 'Baik' : 'Belum Baik';
    const classGdr = r.gdr <= 45 ? 'status-baik' : 'status-belum-baik';
    const classNdr = r.ndr <= 25 ? 'status-baik' : 'status-belum-baik';
    tabelHtml += `<tr>
      <td>${r.tahun}</td>
      <td>${r.gdr.toFixed(2)}</td>
      <td>&le;45‰</td>
      <td class="${classGdr}">${statusGdr}</td>
      <td>${r.ndr.toFixed(2)}</td>
      <td>&le;25‰</td>
      <td class="${classNdr}">${statusNdr}</td>
    </tr>`;
  });
  document.getElementById('mortalitasTabel').innerHTML = tabelHtml;
  document.getElementById('mortalitasTabelSection').style.display = 'block';

  gambarGrafikGaris('grafikGdr', 'GDR', rows.map(r => r.tahun), rows.map(r => r.gdr), '#1565c0');
  gambarGrafikGaris('grafikNdr', 'NDR', rows.map(r => r.tahun), rows.map(r => r.ndr), '#d32f2f');
  document.getElementById('mortalitasGrafikGdrSection').style.display = 'block';
  document.getElementById('mortalitasGrafikNdrSection').style.display = 'block';

  tampilkanTrend('trendGdrTabel', 'trendGdrKesimpulan', rows.map(r => r.tahun), rows.map(r => r.gdr), 'GDR');
  tampilkanTrend('trendNdrTabel', 'trendNdrKesimpulan', rows.map(r => r.tahun), rows.map(r => r.ndr), 'NDR');
  document.getElementById('mortalitasTrendSection').style.display = 'block';

  document.getElementById('mortalitasTabelSection').scrollIntoView({ behavior: 'smooth' });
});

document.getElementById('btnCetakMortalitas').addEventListener('click', function () {
  cetakTabel('mortalitasTabel', 'Laporan GDR dan NDR per Tahun');
});

function gambarGrafikGaris(containerId, legendLabel, labelX, dataY, warna) {
  const lebar = 650, tinggi = 340, margin = 55, legendWidth = 110;
  const chartRight = lebar - legendWidth - 10;
  const n = dataY.length;
  const maxY = Math.max(...dataY) * 1.2;

  function posX(i) { return margin + (i / (n - 1)) * (chartRight - margin); }
  function posY(v) { return tinggi - margin - (v / maxY) * (tinggi - margin - 30); }

  let gridY = '';
  const jumlahGrid = 5;
  for (let g = 0; g <= jumlahGrid; g++) {
    const nilai = (maxY / jumlahGrid) * g;
    const y = posY(nilai);
    gridY += `<line x1="${margin}" y1="${y}" x2="${chartRight}" y2="${y}" stroke="#eee" stroke-width="1"/>`;
    gridY += `<text x="${margin - 8}" y="${y + 4}" text-anchor="end" font-size="10" fill="#999">${nilai.toFixed(0)}</text>`;
  }

  const titikPolyline = dataY.map((v, i) => `${posX(i)},${posY(v)}`).join(' ');

  let titikDanLabel = '';
  dataY.forEach((v, i) => {
    titikDanLabel += `<circle cx="${posX(i)}" cy="${posY(v)}" r="4" fill="${warna}"/>`;
    titikDanLabel += `<text x="${posX(i)}" y="${posY(v) - 10}" text-anchor="middle" font-size="11" fill="${warna}" font-weight="bold">${v.toFixed(2)}</text>`;
    titikDanLabel += `<text x="${posX(i)}" y="${tinggi - margin + 14}" text-anchor="end" font-size="10" fill="#666" transform="rotate(-35, ${posX(i)}, ${tinggi - margin + 14})">TAHUN ${labelX[i]}</text>`;
  });

  const legendY = tinggi / 2 - 10;

  const svg = `
    <svg viewBox="0 0 ${lebar} ${tinggi}" style="width:100%; height:auto; font-family:'Segoe UI',Arial;">
      <rect x="2" y="2" width="${lebar - 4}" height="${tinggi - 4}" fill="none" stroke="#ccc" stroke-width="1"/>
      ${gridY}
      <line x1="${margin}" y1="${tinggi - margin}" x2="${chartRight}" y2="${tinggi - margin}" stroke="#333" stroke-width="1.5"/>
      <line x1="${margin}" y1="${tinggi - margin}" x2="${margin}" y2="20" stroke="#333" stroke-width="1.5"/>
      <polyline points="${titikPolyline}" fill="none" stroke="${warna}" stroke-width="2.5"/>
      ${titikDanLabel}
      <line x1="${chartRight + 15}" y1="${legendY}" x2="${chartRight + 45}" y2="${legendY}" stroke="${warna}" stroke-width="2.5"/>
      <circle cx="${chartRight + 30}" cy="${legendY}" r="4" fill="${warna}"/>
      <text x="${chartRight + 15}" y="${legendY + 20}" font-size="11" fill="#333">NILAI</text>
      <text x="${chartRight + 15}" y="${legendY + 34}" font-size="11" fill="#333">${legendLabel}</text>
      <text x="${chartRight + 15}" y="${legendY + 48}" font-size="11" fill="#333">(‰)</text>
    </svg>
  `;
  document.getElementById(containerId).innerHTML = svg;
}

function hitungTrendLinier(dataY) {
  const n = dataY.length;
  const xs = [];
  for (let i = 0; i < n; i++) {
    xs.push(n % 2 === 1 ? (i - (n - 1) / 2) : (2 * i - (n - 1)));
  }
  const sumY = dataY.reduce((s, y) => s + y, 0);
  const sumXY = xs.reduce((s, x, i) => s + x * dataY[i], 0);
  const sumX2 = xs.reduce((s, x) => s + x * x, 0);
  const a = sumY / n;
  const b = sumXY / sumX2;
  const trend = xs.map(x => a + b * x);
  return { xs, a, b, trend, sumY, sumXY, sumX2 };
}

function tampilkanTrend(tabelId, kesimpulanId, tahunArr, dataY, label) {
  const hasil = hitungTrendLinier(dataY);
  let html = '<tr><th>Tahun</th><th>X</th><th>Y (' + label + ')</th><th>X²</th><th>XY</th><th>Trend</th></tr>';
  tahunArr.forEach((t, i) => {
    html += `<tr>
      <td>${t}</td>
      <td>${hasil.xs[i]}</td>
      <td>${dataY[i].toFixed(2)}</td>
      <td>${hasil.xs[i] * hasil.xs[i]}</td>
      <td>${(hasil.xs[i] * dataY[i]).toFixed(2)}</td>
      <td>${hasil.trend[i].toFixed(2)}</td>
    </tr>`;
  });
  html += `<tr style="font-weight:700; background:#f5f5f5;">
    <td>Total</td><td>-</td><td>${hasil.sumY.toFixed(2)}</td><td>${hasil.sumX2}</td><td>${hasil.sumXY.toFixed(2)}</td><td>-</td>
  </tr>`;
  document.getElementById(tabelId).innerHTML = html;

  const arah = hasil.b < 0 ? 'penurunan' : 'kenaikan';
  document.getElementById(kesimpulanId).innerHTML =
    `Nilai trend ${label} mengalami <strong>${arah}</strong> setiap tahunnya sebesar <strong>${Math.abs(hasil.b).toFixed(2)} ‰</strong> (a = ${hasil.a.toFixed(3)}, b = ${hasil.b.toFixed(3)}).`;
}

(function buatBarisInputMorbiditas() {
  const container = document.getElementById('morbiditasInputList');
  let html = '';
  for (let i = 1; i <= 10; i++) {
    html += `
      <div class="morbiditas-row">
        <span class="row-number">${i}</span>
        <input type="text" id="diagnosisNama${i}" placeholder="Nama diagnosis (contoh: Diare)">
        <input type="number" id="diagnosisJumlah${i}" placeholder="Jumlah kasus" min="0">
      </div>
    `;
  }
  container.innerHTML = html;
})();

document.getElementById('morbiditasForm').addEventListener('submit', function (e) {
  e.preventDefault();

  const data = [];
  for (let i = 1; i <= 10; i++) {
    const nama = document.getElementById('diagnosisNama' + i).value.trim();
    const jumlah = Number(document.getElementById('diagnosisJumlah' + i).value) || 0;
    if (nama !== '' && jumlah > 0) {
      data.push({ nama: nama, jumlah: jumlah });
    }
  }

  if (data.length === 0) {
    alert('Isi minimal 1 baris diagnosis dengan jumlah kasus lebih dari 0.');
    return;
  }

  data.sort((a, b) => b.jumlah - a.jumlah);
  const totalKasus = data.reduce((sum, d) => sum + d.jumlah, 0);

  let html = '';
  data.forEach(function (d) {
    const persen = (d.jumlah / totalKasus) * 100;
    html += `
      <div class="bar-chart-row">
        <div class="bar-chart-label" title="${d.nama}">${d.nama}</div>
        <div class="bar-chart-track">
          <div class="bar-chart-fill" style="width:${persen}%;">${persen.toFixed(1)}%</div>
        </div>
        <div class="bar-chart-jumlah">${d.jumlah} kasus</div>
      </div>
    `;
  });

  document.getElementById('morbiditasChartContainer').innerHTML = html;
  document.getElementById('morbiditasHasilSection').style.display = 'block';
  document.getElementById('morbiditasHasilSection').scrollIntoView({ behavior: 'smooth' });
});

let daftarIcd10Data = [];
let daftarIcd9cmData = [];

fetch('icd10.json')
  .then(res => res.json())
  .then(data => {
    daftarIcd10Data = data;
    const dl = document.getElementById('daftarIcd10');
    dl.innerHTML = '';
    data.forEach(d => {
      const opt = document.createElement('option');
      opt.value = d.nama;
      dl.appendChild(opt);
    });
    console.log('ICD-10 dimuat:', data.length, 'kode');
  })
  .catch(err => console.error('Gagal memuat icd10.json:', err));

fetch('icd9cm.json')
  .then(res => res.json())
  .then(data => {
    daftarIcd9cmData = data;
    const dl = document.getElementById('daftarIcd9cm');
    if (dl) {
      dl.innerHTML = '';
      data.forEach(d => {
        const opt = document.createElement('option');
        opt.value = d.nama;
        dl.appendChild(opt);
      });
    }
    console.log('ICD-9-CM dimuat:', data.length, 'kode');
  })
  .catch(err => console.error('Gagal memuat icd9cm.json:', err));

document.getElementById('dNamaPenyakit').addEventListener('input', function () {
  const found = daftarIcd10Data.find(d => d.nama.toLowerCase() === this.value.toLowerCase());
  if (found) document.getElementById('dKodeIcd').value = found.kode;
});

const inputTindakanEl = document.getElementById('dNamaTindakan');
if (inputTindakanEl) {
  inputTindakanEl.addEventListener('input', function () {
    const found = daftarIcd9cmData.find(d => d.nama.toLowerCase() === this.value.toLowerCase());
    if (found) document.getElementById('dKodeIcd9').value = found.kode;
  });
}

function ambilDataPasien() {
  return JSON.parse(localStorage.getItem('dataPasienPulang') || '[]');
}
function simpanDataPasien(data) {
  localStorage.setItem('dataPasienPulang', JSON.stringify(data));
}

function labelKeadaan(kode) {
  if (kode === 'hidup') return 'Hidup';
  if (kode === 'mati_kurang48') return 'Mati &lt; 48 Jam';
  if (kode === 'mati_lebih48') return 'Mati &ge; 48 Jam';
  return '-';
}

function labelCaraKeluar(kode, keadaanPulang) {
  const peta = {
    pulang: 'Pulang' + (keadaanPulang ? ' (' + keadaanPulang + ')' : ''),
    rujuk: 'Dirujuk',
    pindah_rs: 'Pindah RS Lain',
    pulang_paksa: 'Pulang Paksa',
    lari: 'Lari',
    mati_kurang48: 'Meninggal &lt; 48 Jam',
    mati_lebih48: 'Meninggal &ge; 48 Jam',
  };
  return peta[kode] || '-';
}

function klasifikasiKelas(poli) {
  if (!poli) return 'Lainnya';
  const p = poli.toUpperCase().replace(/\s+/g, '');
  if (p.includes('VIP') || p.includes('UTAMA')) return 'Utama/VIP';
  if (p.includes('IIIA') || p.includes('3A')) return 'IIIA';
  if (p.includes('IIIB') || p.includes('3B')) return 'IIIB';
  if (p.includes('III')) return 'IIIA';
  if (p.includes('II')) return 'II';
  if (p.includes('I')) return 'I';
  return 'Lainnya';
}

const NAMA_BULAN = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];

function hitungUmurDariTanggal(tglLahirStr, tglAcuanStr) {
  const lahir = new Date(tglLahirStr + 'T00:00:00');
  const acuan = tglAcuanStr ? new Date(tglAcuanStr + 'T00:00:00') : new Date();
  let umur = acuan.getFullYear() - lahir.getFullYear();
  const bulanBeda = acuan.getMonth() - lahir.getMonth();
  if (bulanBeda < 0 || (bulanBeda === 0 && acuan.getDate() < lahir.getDate())) umur--;
  return umur < 0 ? 0 : umur;
}

function perbaruiUmurOtomatis() {
  const tglLahir = document.getElementById('pmTglLahir').value;
  const tglMasuk = document.getElementById('pmTglMasuk').value;
  if (!tglLahir) {
    document.getElementById('pmUmur').value = '';
    return;
  }
  document.getElementById('pmUmur').value = hitungUmurDariTanggal(tglLahir, tglMasuk);
}
document.getElementById('pmTglLahir').addEventListener('change', perbaruiUmurOtomatis);
document.getElementById('pmTglMasuk').addEventListener('change', perbaruiUmurOtomatis);

let indexEditPasien = null;

document.getElementById('pasienMasukForm').addEventListener('submit', function (e) {
  e.preventDefault();
  const data = ambilDataPasien();
  const mrnBaru = document.getElementById('pmMrn').value.trim();
  const namaBaru = document.getElementById('pmNama').value.trim();
  const dpjpBaru = document.getElementById('pmDpjp').value.trim();
  const ruanganBaru = document.getElementById('pmRuangan').value.trim();
  const poliBaru = document.getElementById('pmPoli').value.trim();
  const alamatBaru = document.getElementById('pmAlamat').value.trim();
  const tglLahirBaru = document.getElementById('pmTglLahir').value;
  const tglMasukBaru = document.getElementById('pmTglMasuk').value;

  if (mrnBaru === '' || namaBaru === '' || dpjpBaru === '' || ruanganBaru === '' || poliBaru === '' || alamatBaru === '') {
    alert('Semua kolom wajib diisi (tidak boleh kosong atau hanya berisi spasi).');
    return;
  }

  if (!tglLahirBaru) {
    alert('Tanggal Lahir wajib diisi.');
    return;
  }

  const hariIni = new Date().toISOString().slice(0, 10);
  if (tglLahirBaru > hariIni) {
    alert('Tanggal Lahir tidak boleh di masa depan (setelah hari ini).');
    return;
  }
  if (tglMasukBaru && tglLahirBaru > tglMasukBaru) {
    alert('Tanggal Lahir tidak boleh setelah Tanggal Masuk.');
    return;
  }

  const umurBaru = hitungUmurDariTanggal(tglLahirBaru, tglMasukBaru);
  if (umurBaru < 0 || umurBaru > 120) {
    alert('Umur hasil hitung dari Tanggal Lahir tidak wajar. Cek kembali Tanggal Lahir dan Tanggal Masuk.');
    return;
  }

  if (tglMasukBaru > hariIni) {
    alert('Tanggal Masuk tidak boleh di masa depan (setelah hari ini).');
    return;
  }

  const rmDipakai = data.some((p, i) => p.mrn === mrnBaru && i !== indexEditPasien);
  if (rmDipakai) {
    alert('No. RM "' + mrnBaru + '" sudah terdaftar. Gunakan No. RM lain atau cek data yang sudah ada.');
    return;
  }

 const isian = {
    mrn: mrnBaru,
    nama: document.getElementById('pmNama').value.trim(),
    tglLahir: tglLahirBaru,
    umur: umurBaru,
    jk: document.getElementById('pmJk').value,
    poli: document.getElementById('pmPoli').value.trim(),
    ruangan: ruanganBaru,
    departemen: document.getElementById('pmDepartemen').value,
    caraMasuk: document.getElementById('pmCaraMasuk').value,
    alamat: document.getElementById('pmAlamat').value.trim(),
    tglMasuk: document.getElementById('pmTglMasuk').value,
    dpjp: document.getElementById('pmDpjp').value.trim(),
  };

  if (indexEditPasien !== null) {
    Object.assign(data[indexEditPasien], isian);
    const p = data[indexEditPasien];
    if (!p.riwayatPenempatan || !p.riwayatPenempatan.length) {
      p.riwayatPenempatan = [{ tanggal: isian.tglMasuk, ruangan: isian.ruangan, kelas: isian.poli, departemen: isian.departemen }];
    } else {
      p.riwayatPenempatan[0] = { tanggal: isian.tglMasuk, ruangan: isian.ruangan, kelas: isian.poli, departemen: isian.departemen };
    }
    indexEditPasien = null;
    document.querySelector('#pasienMasukForm button[type="submit"]').textContent = 'Simpan Pasien Masuk';
    document.getElementById('btnBatalEditPasien').style.display = 'none';
  } else {
    data.push({
      ...isian,
      tglKeluar: null,
      keadaanKeluar: null,
      diagnosa: [],
      riwayatPenempatan: [{ tanggal: isian.tglMasuk, ruangan: isian.ruangan, kelas: isian.poli, departemen: isian.departemen }]
    });
  }

  simpanDataPasien(data);
  renderTabelPasienAktif();
  renderTabelPasien();
  renderBeranda();
  this.reset();
});

function bukaFormEditPasien(index) {
  indexEditPasien = index;
  const p = ambilDataPasien()[index];
  document.getElementById('pmMrn').value = p.mrn;
  document.getElementById('pmNama').value = p.nama;
  document.getElementById('pmTglLahir').value = p.tglLahir || '';
  document.getElementById('pmJk').value = p.jk;
  document.getElementById('pmPoli').value = p.poli;
  document.getElementById('pmRuangan').value = p.ruangan || '';
  document.getElementById('pmDepartemen').value = p.departemen || '';
  document.getElementById('pmCaraMasuk').value = p.caraMasuk || '';
  document.getElementById('pmAlamat').value = p.alamat || '';
  document.getElementById('pmTglMasuk').value = p.tglMasuk;
  document.getElementById('pmDpjp').value = p.dpjp;
  perbaruiUmurOtomatis();
  document.querySelector('#pasienMasukForm button[type="submit"]').textContent = 'Simpan Perubahan';
  document.getElementById('btnBatalEditPasien').style.display = 'block';
  pindahMenu('viewPasien');
  document.getElementById('pasienMasukForm').scrollIntoView({ behavior: 'smooth' });
}

function batalEditPasien() {
  indexEditPasien = null;
  document.getElementById('pasienMasukForm').reset();
  document.getElementById('pmUmur').value = '';
  document.querySelector('#pasienMasukForm button[type="submit"]').textContent = 'Simpan Pasien Masuk';
  document.getElementById('btnBatalEditPasien').style.display = 'none';
}

function renderTabelPasienAktif() {
  const keyword = (document.getElementById('cariPasienAktif')?.value || '').toLowerCase();
  const data = ambilDataPasien();
 let html = '<tr><th>No. RM</th><th>Nama</th><th>Umur</th><th>JK</th><th>Departemen</th><th>Kelas</th><th>Ruangan</th><th>Alamat</th><th>Tgl Masuk</th><th>DPJP</th><th>Aksi</th></tr>';
  let ada = false;
  data.forEach((p, i) => {
    if (p.tglKeluar) return;
    if (keyword && !p.nama.toLowerCase().includes(keyword) && !p.mrn.toLowerCase().includes(keyword)) return;
    ada = true;
    html += `<tr>
      <td>${p.mrn}</td><td>${p.nama}</td><td>${p.umur}</td><td>${p.jk}</td><td>${p.departemen || '-'}</td><td>${p.poli}</td><td>${p.ruangan || '-'}</td><td>${p.alamat || '-'}</td>
      <td>${p.tglMasuk}</td><td>${p.dpjp}</td>
      <td>
        <button type="button" class="btn-diagnosa" onclick="bukaFormEditPasien(${i})">Edit</button>
        <button type="button" class="btn-diagnosa" onclick="bukaFormPindahRuangan(${i})">Pindah Ruangan</button>
        <button type="button" class="btn-diagnosa" onclick="bukaFormPulang(${i})">Proses Pulang</button>
        <button type="button" class="btn-hapus" onclick="hapusPasien(${i})">Hapus</button>
      </td>
    </tr>`;
  });
  if (!ada) html += '<tr><td colspan="11">Tidak ada pasien yang cocok</td></tr>';
  document.getElementById('tabelPasienAktif').innerHTML = html;
}

let indexPasienUntukPulang = null;

function ambilPenempatanPadaTanggal(p, tglStr) {
  const riwayat = (p.riwayatPenempatan && p.riwayatPenempatan.length)
    ? p.riwayatPenempatan
    : [{ tanggal: p.tglMasuk, ruangan: p.ruangan, kelas: p.poli, departemen: p.departemen }];
  let aktif = riwayat[0];
  for (const r of riwayat) {
    if (r.tanggal <= tglStr) aktif = r; else break;
  }
  return aktif;
}

let indexPasienUntukPindah = null;

function bukaFormPindahRuangan(index) {
  indexPasienUntukPindah = index;
  const p = ambilDataPasien()[index];
  document.getElementById('pindahRuanganPasienInfo').textContent = `Pasien: ${p.nama} (No. RM: ${p.mrn}) — Ruangan/Kelas/Departemen saat ini: ${p.ruangan || '-'} / ${p.poli} / ${p.departemen || '-'}`;
  document.getElementById('prTglPindah').min = p.tglMasuk;
  renderTabelRiwayatPindah(p);
  document.getElementById('pindahRuanganFormSection').style.display = 'block';
  document.getElementById('pindahRuanganFormSection').scrollIntoView({ behavior: 'smooth' });
}

function renderTabelRiwayatPindah(p) {
  const riwayat = (p.riwayatPenempatan && p.riwayatPenempatan.length)
    ? p.riwayatPenempatan
    : [{ tanggal: p.tglMasuk, ruangan: p.ruangan, kelas: p.poli, departemen: p.departemen }];
  let html = '<tr><th>Tanggal</th><th>Ruangan</th><th>Kelas</th><th>Departemen</th><th>Keterangan</th></tr>';
  riwayat.forEach((r, i) => {
    html += `<tr><td>${r.tanggal}</td><td>${r.ruangan}</td><td>${r.kelas}</td><td>${r.departemen || '-'}</td><td>${i === 0 ? 'Masuk pertama kali' : 'Pindahan intern RS'}</td></tr>`;
  });
  document.getElementById('tabelRiwayatPindah').innerHTML = html;
}

document.getElementById('pindahRuanganForm').addEventListener('submit', function (e) {
  e.preventDefault();
  if (indexPasienUntukPindah === null) return;
  const data = ambilDataPasien();
  const p = data[indexPasienUntukPindah];

  const tglPindah = document.getElementById('prTglPindah').value;
  const hariIni = new Date().toISOString().slice(0, 10);
  if (tglPindah < p.tglMasuk) {
    alert('Tanggal Pindah tidak boleh sebelum Tanggal Masuk pasien.');
    return;
  }
  if (tglPindah > hariIni) {
    alert('Tanggal Pindah tidak boleh di masa depan (setelah hari ini).');
    return;
  }
  const riwayatSekarang = p.riwayatPenempatan && p.riwayatPenempatan.length
    ? p.riwayatPenempatan
    : [{ tanggal: p.tglMasuk, ruangan: p.ruangan, kelas: p.poli, departemen: p.departemen }];
  const tglTerakhir = riwayatSekarang[riwayatSekarang.length - 1].tanggal;
  if (tglPindah < tglTerakhir) {
    alert('Tanggal Pindah tidak boleh sebelum tanggal perpindahan terakhir yang sudah tercatat (' + tglTerakhir + ').');
    return;
  }

  const ruanganBaru = document.getElementById('prRuanganBaru').value.trim();
  const kelasBaru = document.getElementById('prKelasBaru').value.trim();
  if (ruanganBaru === '' || kelasBaru === '') {
    alert('Ruangan Baru dan Kelas Baru wajib diisi (tidak boleh kosong atau hanya berisi spasi).');
    return;
  }
  const departemenBaru = document.getElementById('prDepartemenBaru').value || p.departemen;

  riwayatSekarang.push({ tanggal: tglPindah, ruangan: ruanganBaru, kelas: kelasBaru, departemen: departemenBaru });
  p.riwayatPenempatan = riwayatSekarang;
  p.ruangan = ruanganBaru;
  p.poli = kelasBaru;
  p.departemen = departemenBaru;

  simpanDataPasien(data);
  renderTabelPasienAktif();
  renderBeranda();
  document.getElementById('pindahRuanganPasienInfo').textContent = `Pasien: ${p.nama} (No. RM: ${p.mrn}) — Ruangan/Kelas/Departemen saat ini: ${p.ruangan} / ${p.poli} / ${p.departemen}`;
  renderTabelRiwayatPindah(p);
  this.reset();
  alert('Perpindahan ruangan/kelas/departemen tersimpan.');
});

function bukaFormPulang(index) {
  indexPasienUntukPulang = index;
  const p = ambilDataPasien()[index];
  document.getElementById('pulangPasienInfo').textContent = `Pasien: ${p.nama} (No. RM: ${p.mrn}) — Masuk: ${p.tglMasuk}`;
  document.getElementById('plTglKeluar').value = p.tglKeluar || '';
  document.getElementById('plJamKeluar').value = p.jamKeluar || '';
  document.getElementById('plCaraKeluar').value = p.caraKeluar || '';
  document.getElementById('grupKeadaanPulang').style.display = 'block';
  document.getElementById('plKeadaanPulang').value = p.keadaanPulang || '';
  document.getElementById('plCaraBayar').value = p.caraBayar || '';
  document.getElementById('pulangFormSection').style.display = 'block';
  document.getElementById('pulangFormSection').scrollIntoView({ behavior: 'smooth' });
}

document.getElementById('plCaraKeluar').addEventListener('change', function () {
  document.getElementById('plKeadaanPulang').required = false;
});

document.getElementById('pulangForm').addEventListener('submit', function (e) {
  e.preventDefault();
  if (indexPasienUntukPulang === null) return;
  const data = ambilDataPasien();
  const tglKeluar = document.getElementById('plTglKeluar').value;
  const hariIni = new Date().toISOString().slice(0, 10);

  if (tglKeluar < data[indexPasienUntukPulang].tglMasuk) {
    alert('Tanggal Keluar tidak boleh sebelum Tanggal Masuk.');
    return;
  }
  if (tglKeluar > hariIni) {
    alert('Tanggal Keluar tidak boleh di masa depan (setelah hari ini).');
    return;
  }
  const riwayatPasien = data[indexPasienUntukPulang].riwayatPenempatan;
  if (riwayatPasien && riwayatPasien.length) {
    const tglPindahTerakhir = riwayatPasien[riwayatPasien.length - 1].tanggal;
    if (tglKeluar < tglPindahTerakhir) {
      alert('Tanggal Keluar tidak boleh sebelum tanggal perpindahan ruangan terakhir yang sudah tercatat (' + tglPindahTerakhir + ').');
      return;
    }
  }

  const caraKeluar = document.getElementById('plCaraKeluar').value;

  let keadaanKeluar;
  if (caraKeluar === 'mati_kurang48' || caraKeluar === 'mati_lebih48') {
    keadaanKeluar = caraKeluar;
  } else {
    keadaanKeluar = 'hidup';
  }

  data[indexPasienUntukPulang].tglKeluar = tglKeluar;
  data[indexPasienUntukPulang].jamKeluar = document.getElementById('plJamKeluar').value;
  data[indexPasienUntukPulang].caraKeluar = caraKeluar;
  data[indexPasienUntukPulang].keadaanKeluar = keadaanKeluar;
  data[indexPasienUntukPulang].keadaanPulang = document.getElementById('plKeadaanPulang').value;
  data[indexPasienUntukPulang].caraBayar = document.getElementById('plCaraBayar').value;

  simpanDataPasien(data);
  renderTabelPasienAktif();
  renderTabelPasien();
  renderBeranda();
  document.getElementById('pulangFormSection').style.display = 'none';
  this.reset();
  indexPasienUntukPulang = null;
});

function isiFilterTahunPasienPulang() {
  const selectEl = document.getElementById('filterTahunPasienPulang');
  if (!selectEl) return;
  const nilaiSekarang = selectEl.value;
  const tahunTersedia = [...new Set(ambilDataPasien().filter(p => p.tglKeluar).map(p => p.tglKeluar.slice(0, 4)))].sort((a, b) => b.localeCompare(a));
  let html = '<option value="">Semua Tahun</option>';
  tahunTersedia.forEach(t => html += `<option value="${t}">${t}</option>`);
  selectEl.innerHTML = html;
  if (tahunTersedia.includes(nilaiSekarang)) selectEl.value = nilaiSekarang;
}

function renderTabelPasien() {
  isiFilterTahunPasienPulang();
  const keyword = (document.getElementById('cariPasienPulang')?.value || '').toLowerCase();
  const tahunFilter = document.getElementById('filterTahunPasienPulang')?.value || '';
  const data = ambilDataPasien();
  let html = '<tr><th>No. RM</th><th>Nama</th><th>Umur</th><th>JK</th><th>Departemen</th><th>Kelas</th><th>Ruangan</th><th>Alamat</th><th>Tgl Masuk</th><th>Tgl Keluar</th><th>Jam Keluar</th><th>Cara Keluar</th><th>Cara Bayar</th><th>DPJP</th><th>Diagnosa &amp; Tindakan</th><th>Aksi</th></tr>';
  let ada = false;
  data.forEach((p, i) => {
    if (!p.tglKeluar) return;
    if (tahunFilter && p.tglKeluar.slice(0, 4) !== tahunFilter) return;
    if (keyword && !p.nama.toLowerCase().includes(keyword) && !p.mrn.toLowerCase().includes(keyword)) return;
    ada = true;
    const diagnosaText = p.diagnosa.length > 0
      ? p.diagnosa.map(d => {
          let baris = `${d.kode} - ${d.nama}`;
          if (d.kodeTindakan) {
            baris += `<br><span style="color:#666; font-size:11px;">Tindakan: ${d.kodeTindakan} - ${d.namaTindakan}</span>`;
          }
          return baris;
        }).join('<hr style="margin:4px 0; border-top:1px dashed #ddd;">')
      : '<span style="color:#d32f2f;">Belum diisi</span>';
    html += `<tr>
      <td>${p.mrn}</td><td>${p.nama}</td><td>${p.umur}</td><td>${p.jk}</td><td>${p.departemen || '-'}</td><td>${p.poli}</td><td>${p.ruangan || '-'}</td><td>${p.alamat || '-'}</td>
      <td>${p.tglMasuk || '-'}</td><td>${p.tglKeluar}</td><td>${p.jamKeluar || '-'}</td><td>${labelCaraKeluar(p.caraKeluar, p.keadaanPulang)}</td>
      <td>${p.caraBayar || '-'}</td><td>${p.dpjp}</td><td>${diagnosaText}</td>
      <td>
        <button type="button" class="btn-diagnosa" onclick="bukaFormEditPasien(${i})">Edit</button>
        <button type="button" class="btn-diagnosa" onclick="bukaFormPulang(${i})">Edit Data Pulang</button>
        <button type="button" class="btn-diagnosa" onclick="bukaFormDiagnosa(${i})">Diagnosa</button>
        <button type="button" class="btn-hapus" onclick="hapusPasien(${i})">Hapus</button>
      </td>
    </tr>`;
  });
  if (!ada) html += '<tr><td colspan="16">Belum ada pasien yang cocok</td></tr>';
  document.getElementById('tabelPasien').innerHTML = html;
}

let indexPasienAktif = null;
let indexDiagnosaEdit = null;

function bukaFormDiagnosa(index) {
  indexPasienAktif = index;
  indexDiagnosaEdit = null;
  const data = ambilDataPasien();
  const p = data[index];
  document.getElementById('diagnosaPasienInfo').textContent = `Pasien: ${p.nama} (No. RM: ${p.mrn})`;
  document.getElementById('diagnosaForm').reset();
  document.querySelector('#diagnosaForm button[type="submit"]').textContent = 'Simpan Diagnosa';
  document.getElementById('btnBatalEditDiagnosa').style.display = 'none';
  renderDaftarDiagnosaPasien();
  document.getElementById('diagnosaFormSection').style.display = 'block';
  document.getElementById('diagnosaFormSection').scrollIntoView({ behavior: 'smooth' });
}

function renderDaftarDiagnosaPasien() {
  if (indexPasienAktif === null) return;
  const p = ambilDataPasien()[indexPasienAktif];
  const container = document.getElementById('daftarDiagnosaPasienSection');
  if (!p.diagnosa || p.diagnosa.length === 0) {
    container.style.display = 'none';
    return;
  }
  let html = '<tr><th>Diagnosa</th><th>Tindakan</th><th>Aksi</th></tr>';
  p.diagnosa.forEach((d, di) => {
    html += `<tr>
      <td>${d.kode} - ${d.nama}</td>
      <td>${d.kodeTindakan ? d.kodeTindakan + ' - ' + d.namaTindakan : '-'}</td>
      <td>
        <button type="button" class="btn-diagnosa" onclick="bukaFormEditDiagnosa(${di})">Edit</button>
        <button type="button" class="btn-hapus" onclick="hapusDiagnosa(${di})">Hapus</button>
      </td>
    </tr>`;
  });
  document.getElementById('tabelDaftarDiagnosaPasien').innerHTML = html;
  container.style.display = 'block';
}

function bukaFormEditDiagnosa(diagnosaIndex) {
  if (indexPasienAktif === null) return;
  const d = ambilDataPasien()[indexPasienAktif].diagnosa[diagnosaIndex];
  indexDiagnosaEdit = diagnosaIndex;
  document.getElementById('dNamaPenyakit').value = d.nama;
  document.getElementById('dKodeIcd').value = d.kode;
  document.getElementById('dNamaTindakan').value = d.namaTindakan || '';
  document.getElementById('dKodeIcd9').value = d.kodeTindakan || '';
  document.querySelector('#diagnosaForm button[type="submit"]').textContent = 'Simpan Perubahan Diagnosa';
  document.getElementById('btnBatalEditDiagnosa').style.display = 'block';
  document.getElementById('diagnosaForm').scrollIntoView({ behavior: 'smooth' });
}

function batalEditDiagnosa() {
  indexDiagnosaEdit = null;
  document.getElementById('diagnosaForm').reset();
  document.querySelector('#diagnosaForm button[type="submit"]').textContent = 'Simpan Diagnosa';
  document.getElementById('btnBatalEditDiagnosa').style.display = 'none';
}

function hapusDiagnosa(diagnosaIndex) {
  if (indexPasienAktif === null) return;
  if (!confirm('Hapus diagnosa ini?')) return;
  const data = ambilDataPasien();
  data[indexPasienAktif].diagnosa.splice(diagnosaIndex, 1);
  simpanDataPasien(data);
  renderTabelPasien();
  renderTabelPenyakit();
  renderBeranda();
  renderDaftarDiagnosaPasien();
  batalEditDiagnosa();
}

document.getElementById('diagnosaForm').addEventListener('submit', function (e) {
  e.preventDefault();
  if (indexPasienAktif === null) return;

  const namaPenyakit = document.getElementById('dNamaPenyakit').value.trim();
  const kodeIcd = document.getElementById('dKodeIcd').value.trim();
  const namaTindakan = document.getElementById('dNamaTindakan').value.trim();
  const kodeTindakan = document.getElementById('dKodeIcd9').value.trim();

  if (namaPenyakit === '' || kodeIcd === '') {
    alert('Nama Diagnosa dan Kode ICD-10 wajib diisi (tidak boleh kosong atau hanya berisi spasi).');
    return;
  }

  const data = ambilDataPasien();
  const isianDiagnosa = { nama: namaPenyakit, kode: kodeIcd, namaTindakan: namaTindakan, kodeTindakan: kodeTindakan };
  if (indexDiagnosaEdit !== null) {
    data[indexPasienAktif].diagnosa[indexDiagnosaEdit] = isianDiagnosa;
  } else {
    data[indexPasienAktif].diagnosa.push(isianDiagnosa);
  }
  simpanDataPasien(data);
  renderTabelPasien();
  renderTabelPenyakit();
  renderBeranda();
  renderDaftarDiagnosaPasien();
  batalEditDiagnosa();
});

function hapusPasien(index) {
  if (!confirm('Hapus data pasien ini?')) return;
  const data = ambilDataPasien();
  data.splice(index, 1);
  simpanDataPasien(data);
  renderTabelPasienAktif();
  renderTabelPasien();
  renderTabelPenyakit();
  renderBeranda();
}

document.getElementById('btnTampilRekap').addEventListener('click', function () {
  const awal = document.getElementById('rekapAwal').value;
  const akhir = document.getElementById('rekapAkhir').value;
  if (!awal || !akhir) {
    alert('Pilih periode awal dan akhir terlebih dahulu.');
    return;
  }
  const data = ambilDataPasien().filter(p => p.tglKeluar && p.tglKeluar >= awal && p.tglKeluar <= akhir && p.diagnosa.length > 0);
  data.sort((a, b) => (a.diagnosa[0].kode || '').localeCompare(b.diagnosa[0].kode || ''));

  let html = '<tr><th>No. RM</th><th>Nama</th><th>Umur</th><th>JK</th><th>Poli</th><th>Ruangan</th><th>Tgl Keluar</th><th>DPJP</th><th>Diagnosa</th></tr>';
  data.forEach(p => {
    const diagnosaText = p.diagnosa.map(d => `${d.kode} - ${d.nama}`).join(', ');
    html += `<tr><td>${p.mrn}</td><td>${p.nama}</td><td>${p.umur}</td><td>${p.jk}</td><td>${p.poli}</td><td>${p.ruangan || '-'}</td><td>${p.tglKeluar}</td><td>${p.dpjp}</td><td>${diagnosaText}</td></tr>`;
  });
  document.getElementById('tabelRekap').innerHTML = html || '<tr><td>Tidak ada data pada periode ini</td></tr>';
  document.getElementById('rekapPeriodeInfo').textContent = `Periode: ${awal} s/d ${akhir} — total ${data.length} pasien`;
  document.getElementById('rekapSection').style.display = 'block';
  document.getElementById('rekapSection').scrollIntoView({ behavior: 'smooth' });
});

function renderTabelPenyakit() {
  const data = ambilDataPasien();
  const hitung = {};
  data.forEach(p => {
    p.diagnosa.forEach(d => {
      const key = d.kode + ' - ' + d.nama;
      hitung[key] = (hitung[key] || 0) + 1;
    });
  });
  const daftar = Object.entries(hitung).sort((a, b) => b[1] - a[1]).slice(0, 10);

  let html = '<tr><th>No</th><th>Kode &amp; Nama Penyakit</th><th>Jumlah</th></tr>';
  daftar.forEach((item, i) => {
    html += `<tr><td>${i + 1}</td><td>${item[0]}</td><td>${item[1]}</td></tr>`;
  });
  document.getElementById('tabelPenyakit').innerHTML = html || '<tr><td colspan="3">Belum ada data diagnosa</td></tr>';
}

function cetakTabel(tableId, judul) {
  const tabelEl = document.getElementById(tableId);
  if (!tabelEl || !tabelEl.innerHTML.trim()) {
    alert('Belum ada data untuk dicetak. Tampilkan data tabelnya dulu, baru klik Cetak / PDF.');
    return;
  }
  const areaCetak = document.getElementById('areaCetak');
  areaCetak.innerHTML = `
    <h2>${judul}</h2>
    ${tabelEl.outerHTML}
    <p class="catatan-pdf">Tips: pada jendela cetak, pilih tujuan "Simpan sebagai PDF" untuk menyimpan file PDF-nya.</p>
  `;
  window.print();
}

document.getElementById('btnCetakRekap').addEventListener('click', function () {
  cetakTabel('tabelRekap', 'Laporan Rekapitulasi Pasien Pulang');
});
document.getElementById('btnCetakPenyakit').addEventListener('click', function () {
  cetakTabel('tabelPenyakit', 'Laporan 10 Besar Penyakit');
});
document.getElementById('btnCetakPasienAktif').addEventListener('click', function () {
  cetakTabel('tabelPasienAktif', 'Data Pasien Sedang Dirawat');
});
document.getElementById('btnCetakPasienPulang').addEventListener('click', function () {
  cetakTabel('tabelPasien', 'Data Pasien Sudah Pulang');
});
document.getElementById('btnCetakSensusHarian').addEventListener('click', function () {
  cetakTabel('tabelSensusHarian', 'Rincian Sensus Harian (Format RP1)');
});

const KUNCI_LAST_SENSUS_PERIODE = 'lastSensusPeriode';

document.getElementById('btnRekapSensus').addEventListener('click', function () {
  const tempatTidur = Number(document.getElementById('sensusTempatTidur').value);
  const awal = document.getElementById('sensusAwal').value;
  const akhir = document.getElementById('sensusAkhir').value;

  if (!tempatTidur) {
    alert('Jumlah Tempat Tidur (kapasitas) masih 0 atau belum diisi. Buka Beranda > Pengaturan Tempat Tidur Rumah Sakit dan simpan dulu, atau isi manual kolom "Jumlah Tempat Tidur" di atas.');
    return;
  }
  if (!awal || !akhir) {
    alert('Isi periode awal dan akhir terlebih dahulu.');
    return;
  }
  if (new Date(akhir) < new Date(awal)) {
    alert('Periode akhir tidak boleh sebelum periode awal.');
    return;
  }

  const semuaPasien = ambilDataPasien().filter(p => p.tglMasuk);
  if (semuaPasien.length === 0) {
    alert('Belum ada data pasien dengan Tanggal Masuk terisi. Isi dulu di Langkah 1: Data Pasien.');
    return;
  }

  const daftarHari = [];
  let tglJalan = new Date(awal + 'T00:00:00');
  const tglBatas = new Date(akhir + 'T00:00:00');
  let totalHariPerawatan = 0;

  const KELAS_LIST = ['Utama/VIP', 'I', 'II', 'IIIA', 'IIIB'];

  while (tglJalan <= tglBatas) {
    const tglStr = tglJalan.toISOString().slice(0, 10);

    const pasienAwal = semuaPasien.filter(p => p.tglMasuk < tglStr && (!p.tglKeluar || p.tglKeluar >= tglStr)).length;
    const masuk = semuaPasien.filter(p => p.tglMasuk === tglStr).length;
    const kHidup = semuaPasien.filter(p => p.tglKeluar === tglStr && p.keadaanKeluar === 'hidup').length;
    const kMati48K = semuaPasien.filter(p => p.tglKeluar === tglStr && p.keadaanKeluar === 'mati_kurang48').length;
    const kMati48L = semuaPasien.filter(p => p.tglKeluar === tglStr && p.keadaanKeluar === 'mati_lebih48').length;
    const jmlKeluar = kHidup + kMati48K + kMati48L;
    const pasienAkhir = pasienAwal + masuk - jmlKeluar;

    const hadirHariIni = semuaPasien.filter(p => p.tglMasuk <= tglStr && tglStr < p.tglKeluar);
    const sisaPerKelas = {};
    KELAS_LIST.forEach(k => sisaPerKelas[k] = 0);
    hadirHariIni.forEach(p => {
      const seg = ambilPenempatanPadaTanggal(p, tglStr);
      const k = klasifikasiKelas(seg.kelas);
      if (sisaPerKelas[k] !== undefined) sisaPerKelas[k]++;
    });

    const pindahHariIni = semuaPasien.filter(p => (p.riwayatPenempatan || []).some((r, idx) => idx > 0 && r.tanggal === tglStr)).length;

    totalHariPerawatan += pasienAkhir;
    daftarHari.push({ tanggal: tglStr, pasienAwal, masuk, kHidup, kMati48K, kMati48L, jmlKeluar, pasienAkhir, sisaPerKelas, pindahHariIni });

    tglJalan.setDate(tglJalan.getDate() + 1);
  }

  const pasienSatuHari = semuaPasien.filter(p => p.tglMasuk === p.tglKeluar && p.tglKeluar >= awal && p.tglKeluar <= akhir).length;
  totalHariPerawatan += pasienSatuHari;

  const keluarPeriode = semuaPasien.filter(p => p.tglKeluar >= awal && p.tglKeluar <= akhir);
  const totalKeluarHidup = keluarPeriode.filter(p => p.keadaanKeluar === 'hidup').length;
  const totalMati48Kurang = keluarPeriode.filter(p => p.keadaanKeluar === 'mati_kurang48').length;
  const totalMati48Lebih = keluarPeriode.filter(p => p.keadaanKeluar === 'mati_lebih48').length;
  const totalPasienKeluar = keluarPeriode.length;

  const totalLamaDirawat = keluarPeriode.reduce((s, p) => {
    const los = Math.round((new Date(p.tglKeluar) - new Date(p.tglMasuk)) / 86400000);
    return s + (los === 0 ? 1 : los);
  }, 0);

  if (totalPasienKeluar === 0) {
    alert('Tidak ada pasien yang keluar (pulang) pada periode ini, sehingga AvLOS/TOI/BTO tidak bisa dihitung. Coba periode lain.');
    return;
  }

  const jumlahHariPeriode = Math.round((tglBatas - new Date(awal + 'T00:00:00')) / 86400000) + 1;

  let tabelHtml = '<tr><th>Tanggal</th><th>Awal</th><th>Masuk</th><th>Pindahan</th><th>Keluar Hidup</th><th>Mati&lt;48j</th><th>Mati&ge;48j</th><th>Jml Keluar</th><th>Sisa Total</th><th>Utama/VIP</th><th>Kls I</th><th>Kls II</th><th>Kls IIIA</th><th>Kls IIIB</th></tr>';
  daftarHari.forEach(h => {
    tabelHtml += `<tr><td>${h.tanggal}</td><td>${h.pasienAwal}</td><td>${h.masuk}</td><td>${h.pindahHariIni}</td><td>${h.kHidup}</td><td>${h.kMati48K}</td><td>${h.kMati48L}</td><td>${h.jmlKeluar}</td><td>${h.pasienAkhir}</td>
      <td>${h.sisaPerKelas['Utama/VIP']}</td><td>${h.sisaPerKelas['I']}</td><td>${h.sisaPerKelas['II']}</td><td>${h.sisaPerKelas['IIIA']}</td><td>${h.sisaPerKelas['IIIB']}</td></tr>`;
  });
  document.getElementById('tabelSensusHarian').innerHTML = tabelHtml;
  document.getElementById('sensusHarianSection').style.display = 'block';

  const bulanMap = {};
  daftarHari.forEach(h => {
    const bulanKey = h.tanggal.slice(0, 7);
    if (!bulanMap[bulanKey]) bulanMap[bulanKey] = [];
    bulanMap[bulanKey].push(h);
  });

  const bulanKeys = Object.keys(bulanMap).sort();
  let tabelBulanHtml = '<tr><th>Bulan</th><th>Pasien Awal</th><th>Masuk</th><th>Pindahan</th><th>Keluar Hidup</th><th>Mati&lt;48j</th><th>Mati&ge;48j</th><th>Jml Keluar</th><th>Lama Dirawat</th><th>Pasien Sisa</th><th>Jml Hari Rawat</th><th>Utama/VIP</th><th>Kls I</th><th>Kls II</th><th>Kls IIIA</th><th>Kls IIIB</th><th>Max Sensus Harian</th></tr>';
  let totBulanMasuk = 0, totBulanPindah = 0, totBulanHidup = 0, totBulanM1 = 0, totBulanM2 = 0, totBulanKeluar = 0, totBulanLama = 0, totBulanHariRawat = 0;
  const totKelasBulan = { 'Utama/VIP': 0, 'I': 0, 'II': 0, 'IIIA': 0, 'IIIB': 0 };

  bulanKeys.forEach(bulanKey => {
    const hariList = bulanMap[bulanKey];
    const [tahun, bln] = bulanKey.split('-');
    const namaBulan = NAMA_BULAN[Number(bln) - 1] + ' ' + tahun;

    const pasienAwalBulan = hariList[0].pasienAwal;
    const masukBulan = hariList.reduce((s, h) => s + h.masuk, 0);
    const pindahBulan = hariList.reduce((s, h) => s + (h.pindahHariIni || 0), 0);
    const hidupBulan = hariList.reduce((s, h) => s + h.kHidup, 0);
    const m1Bulan = hariList.reduce((s, h) => s + h.kMati48K, 0);
    const m2Bulan = hariList.reduce((s, h) => s + h.kMati48L, 0);
    const keluarBulan = hidupBulan + m1Bulan + m2Bulan;
    const pasienSisaBulan = hariList[hariList.length - 1].pasienAkhir;
    const jumlahHariRawatBulan = hariList.reduce((s, h) => s + h.pasienAkhir, 0);
    const maxSensusBulan = Math.max(...hariList.map(h => h.pasienAkhir));
    const kelasBulan = { 'Utama/VIP': 0, 'I': 0, 'II': 0, 'IIIA': 0, 'IIIB': 0 };
    hariList.forEach(h => { Object.keys(kelasBulan).forEach(k => kelasBulan[k] += (h.sisaPerKelas[k] || 0)); });

    const keluarPasienBulan = semuaPasien.filter(p => p.tglKeluar && p.tglKeluar.slice(0, 7) === bulanKey);
    const lamaDirawatBulan = keluarPasienBulan.reduce((s, p) => {
      const los = Math.round((new Date(p.tglKeluar) - new Date(p.tglMasuk)) / 86400000);
      return s + (los === 0 ? 1 : los);
    }, 0);

    tabelBulanHtml += `<tr>
      <td>${namaBulan}</td><td>${pasienAwalBulan}</td><td>${masukBulan}</td><td>${pindahBulan}</td><td>${hidupBulan}</td>
      <td>${m1Bulan}</td><td>${m2Bulan}</td><td>${keluarBulan}</td><td>${lamaDirawatBulan}</td>
      <td>${pasienSisaBulan}</td><td>${jumlahHariRawatBulan}</td>
      <td>${kelasBulan['Utama/VIP']}</td><td>${kelasBulan['I']}</td><td>${kelasBulan['II']}</td><td>${kelasBulan['IIIA']}</td><td>${kelasBulan['IIIB']}</td>
      <td>${maxSensusBulan}</td>
    </tr>`;

    totBulanMasuk += masukBulan; totBulanPindah += pindahBulan; totBulanHidup += hidupBulan; totBulanM1 += m1Bulan; totBulanM2 += m2Bulan;
    totBulanKeluar += keluarBulan; totBulanLama += lamaDirawatBulan; totBulanHariRawat += jumlahHariRawatBulan;
    Object.keys(totKelasBulan).forEach(k => totKelasBulan[k] += kelasBulan[k]);
  });

  const sisaAkhirPeriode = bulanKeys.length > 0 ? bulanMap[bulanKeys[bulanKeys.length - 1]].slice(-1)[0].pasienAkhir : 0;
  tabelBulanHtml += `<tr style="font-weight:700; background:#f5f5f5;">
    <td>JUMLAH</td><td>-</td><td>${totBulanMasuk}</td><td>${totBulanPindah}</td><td>${totBulanHidup}</td>
    <td>${totBulanM1}</td><td>${totBulanM2}</td><td>${totBulanKeluar}</td><td>${totBulanLama}</td>
    <td>${sisaAkhirPeriode}</td><td>${totBulanHariRawat}</td>
    <td>${totKelasBulan['Utama/VIP']}</td><td>${totKelasBulan['I']}</td><td>${totKelasBulan['II']}</td><td>${totKelasBulan['IIIA']}</td><td>${totKelasBulan['IIIB']}</td>
    <td>-</td>
  </tr>`;

  document.getElementById('tabelRekapBulanan').innerHTML = tabelBulanHtml;
  document.getElementById('rekapBulananSection').style.display = 'block';

  document.getElementById('ringkasanSensus').innerHTML = `
    <div class="trend-kesimpulan">
      Periode ${awal} s/d ${akhir} (${jumlahHariPeriode} hari, dari ${semuaPasien.length} data pasien):<br>
      Total Hari Perawatan (untuk BOR/TOI) = <strong>${totalHariPerawatan}</strong> |
      Total Lama Dirawat (untuk AvLOS) = <strong>${totalLamaDirawat}</strong><br>
      Total Pasien Keluar (H+M) = <strong>${totalPasienKeluar}</strong>
      (Hidup: ${totalKeluarHidup}, Mati&lt;48j: ${totalMati48Kurang}, Mati&ge;48j: ${totalMati48Lebih})<br>
      Data ini otomatis diisikan ke <em>Indikator Rawat Inap</em> (Langkah 3) dan langsung dihitung, memakai kapasitas tetap ${tempatTidur} tempat tidur.
    </div>
  `;

  document.getElementById('tempatTidur').value = tempatTidur;
  const periodeIndEl = document.getElementById('periode');
  periodeIndEl.readOnly = false;
  periodeIndEl.value = jumlahHariPeriode;
  const periodeIndAwalEl = document.getElementById('periodeIndAwal');
  const periodeIndAkhirEl = document.getElementById('periodeIndAkhir');
  if (periodeIndAwalEl) periodeIndAwalEl.value = awal;
  if (periodeIndAkhirEl) periodeIndAkhirEl.value = akhir;
  const infoPeriodeEl = document.getElementById('infoPeriodeInd');
  if (infoPeriodeEl) infoPeriodeEl.textContent = `Otomatis dari Sensus: ${jumlahHariPeriode} hari kalender (${awal} s/d ${akhir}).`;
  document.getElementById('hariPerawatan').value = totalHariPerawatan;
  document.getElementById('lamaDirawat').value = totalLamaDirawat;
  document.getElementById('pasienKeluar').value = totalPasienKeluar;

  localStorage.setItem(KUNCI_LAST_SENSUS_PERIODE, JSON.stringify({ awal, akhir }));

  renderBarisMortalitas();

  pindahMenu('viewIndikator');
  document.getElementById('hitungForm').requestSubmit();
});

function muatPeriodeSensusTersimpan() {
  const saved = JSON.parse(localStorage.getItem(KUNCI_LAST_SENSUS_PERIODE) || 'null');
  if (!saved) return;
  if (!document.getElementById('sensusAwal').value) document.getElementById('sensusAwal').value = saved.awal;
  if (!document.getElementById('sensusAkhir').value) document.getElementById('sensusAkhir').value = saved.akhir;
}

document.getElementById('btnResetSemua').addEventListener('click', function () {
  if (!confirm('Yakin ingin menghapus SEMUA data pasien? Tindakan ini tidak bisa dibatalkan.')) return;
  if (!confirm('Konfirmasi sekali lagi: semua data pasien, diagnosa, dan riwayat akan hilang permanen. Lanjutkan?')) return;
  localStorage.removeItem('dataPasienPulang');
  renderTabelPasienAktif();
  renderTabelPasien();
  renderTabelPenyakit();
  renderBeranda();
  alert('Semua data pasien telah dihapus.');
});

document.getElementById('btnAturTT').addEventListener('click', function () {
  const div = document.getElementById('formTTDepartemen');
  if (div.style.display === 'block') { div.style.display = 'none'; return; }

  const semua = ambilDataPasien();
  const daftarDept = [...new Set(semua.flatMap(p => {
    const riwayat = (p.riwayatPenempatan && p.riwayatPenempatan.length) ? p.riwayatPenempatan : [{ departemen: p.departemen }];
    return riwayat.map(r => r.departemen);
  }).filter(Boolean))];
  if (daftarDept.length === 0) {
    alert('Belum ada data pasien dengan Jenis Pelayanan/Departemen terisi. Isi dulu di Langkah 1.');
    return;
  }
  const konfigTT = JSON.parse(localStorage.getItem('konfigTTDepartemen') || '{}');

  let html = '<div class="mortalitas-input-list">';
  daftarDept.forEach(dept => {
    const id = 'tt_' + dept.replace(/\s+/g, '_');
    html += `<div class="mortalitas-row-input" style="grid-template-columns: 1fr 150px;">
      <span style="align-self:center; font-size:13px; font-weight:600;">${dept}</span>
      <input type="number" id="${id}" min="0" placeholder="Jumlah TT" value="${konfigTT[dept] || ''}">
    </div>`;
  });
  html += '</div><button type="button" id="btnSimpanTT" class="btn-hitung" style="margin-top:14px;">Simpan Jumlah Tempat Tidur</button>';
  div.innerHTML = html;
  div.style.display = 'block';

  document.getElementById('btnSimpanTT').addEventListener('click', function () {
    const konfig = {};
    daftarDept.forEach(dept => {
      const id = 'tt_' + dept.replace(/\s+/g, '_');
      konfig[dept] = Number(document.getElementById(id).value) || 0;
    });
    localStorage.setItem('konfigTTDepartemen', JSON.stringify(konfig));
    alert('Jumlah tempat tidur per departemen tersimpan.');
    div.style.display = 'none';
  });
});

const KELAS_LIST_RL1 = ['Utama/VIP', 'I', 'II', 'IIIA', 'IIIB'];

function hitungSensusDepartemen(semuaPasien, dept, awal, akhir) {
  const pasienDept = semuaPasien.filter(p => p.departemen === dept);

  let tglJalan = new Date(awal + 'T00:00:00');
  const tglBatas = new Date(akhir + 'T00:00:00');
  let totalHariPerawatan = 0;
  let maxSensusHarian = 0;
  const sisaPerKelas = {}; KELAS_LIST_RL1.forEach(k => sisaPerKelas[k] = 0);

  while (tglJalan <= tglBatas) {
    const tglStr = tglJalan.toISOString().slice(0, 10);
    let hadirHariIni = 0;
    semuaPasien.forEach(p => {
      if (p.tglMasuk <= tglStr && (!p.tglKeluar || tglStr < p.tglKeluar)) {
        const seg = ambilPenempatanPadaTanggal(p, tglStr);
        if (seg.departemen === dept) {
          hadirHariIni++;
          const k = klasifikasiKelas(seg.kelas);
          if (sisaPerKelas[k] !== undefined) sisaPerKelas[k]++;
        }
      }
    });
    totalHariPerawatan += hadirHariIni;
    if (hadirHariIni > maxSensusHarian) maxSensusHarian = hadirHariIni;
    tglJalan.setDate(tglJalan.getDate() + 1);
  }

  const pasienSatuHari = pasienDept.filter(p => p.tglMasuk === p.tglKeluar && p.tglKeluar >= awal && p.tglKeluar <= akhir).length;
  totalHariPerawatan += pasienSatuHari;

  const pasienAwalPeriode = semuaPasien.filter(p =>
    p.tglMasuk < awal && (!p.tglKeluar || p.tglKeluar >= awal) &&
    ambilPenempatanPadaTanggal(p, awal).departemen === dept
  ).length;

  const masukPeriode = semuaPasien.filter(p => {
    if (!(p.tglMasuk >= awal && p.tglMasuk <= akhir)) return false;
    const riwayat = (p.riwayatPenempatan && p.riwayatPenempatan.length) ? p.riwayatPenempatan : [{ departemen: p.departemen }];
    return riwayat[0].departemen === dept;
  }).length;

  const keluarPeriode = pasienDept.filter(p => p.tglKeluar && p.tglKeluar >= awal && p.tglKeluar <= akhir);
  const keluarHidup = keluarPeriode.filter(p => p.keadaanKeluar === 'hidup').length;
  const mati48K = keluarPeriode.filter(p => p.keadaanKeluar === 'mati_kurang48').length;
  const mati48L = keluarPeriode.filter(p => p.keadaanKeluar === 'mati_lebih48').length;
  const jumlahKeluar = keluarHidup + mati48K + mati48L;

  const pasienSisa = semuaPasien.filter(p =>
    p.tglMasuk <= akhir && (!p.tglKeluar || p.tglKeluar > akhir) &&
    ambilPenempatanPadaTanggal(p, akhir).departemen === dept
  ).length;

  const lamaDirawat = keluarPeriode.reduce((s, p) => {
    const los = Math.round((new Date(p.tglKeluar) - new Date(p.tglMasuk)) / 86400000);
    return s + (los === 0 ? 1 : los);
  }, 0);

  let pindahanMasuk = 0, pindahanKeluar = 0;
  semuaPasien.forEach(p => {
    const riwayat = (p.riwayatPenempatan && p.riwayatPenempatan.length)
      ? p.riwayatPenempatan
      : [{ tanggal: p.tglMasuk, departemen: p.departemen }];
    for (let idx = 1; idx < riwayat.length; idx++) {
      const tglPindah = riwayat[idx].tanggal;
      if (tglPindah < awal || tglPindah > akhir) continue;
      const deptSebelum = riwayat[idx - 1].departemen;
      const deptSesudah = riwayat[idx].departemen;
      if (deptSebelum === deptSesudah) continue;
      if (deptSesudah === dept) pindahanMasuk++;
      if (deptSebelum === dept) pindahanKeluar++;
    }
  });

  return { pasienAwalPeriode, masukPeriode, pindahanMasuk, pindahanKeluar, keluarHidup, mati48K, mati48L, jumlahKeluar, totalHariPerawatan, pasienSisa, lamaDirawat, sisaPerKelas, maxSensusHarian };
}

document.getElementById('btnHitungRL1').addEventListener('click', function () {
  const awal = document.getElementById('sensusAwal').value;
  const akhir = document.getElementById('sensusAkhir').value;
  if (!awal || !akhir) {
    alert('Isi Periode Awal & Akhir di form bagian atas dulu.');
    return;
  }

  const semua = ambilDataPasien().filter(p => p.tglMasuk);
  const daftarDept = [...new Set(semua.flatMap(p => {
    const riwayat = (p.riwayatPenempatan && p.riwayatPenempatan.length) ? p.riwayatPenempatan : [{ departemen: p.departemen }];
    return riwayat.map(r => r.departemen);
  }).filter(Boolean))];
  if (daftarDept.length === 0) {
    alert('Belum ada data pasien dengan Jenis Pelayanan/Departemen terisi. Isi dulu di Langkah 1.');
    return;
  }

  const konfigTT = JSON.parse(localStorage.getItem('konfigTTDepartemen') || '{}');
  const jumlahHari = Math.round((new Date(akhir + 'T00:00:00') - new Date(awal + 'T00:00:00')) / 86400000) + 1;

  let html = '<tr><th>No</th><th>Departemen</th><th>TT</th><th>Pasien Awal</th><th>Masuk</th><th>Pindahan Masuk</th><th>Pindahan Keluar</th><th>Keluar Hidup</th><th>Mati&lt;48j</th><th>Mati&ge;48j</th><th>Jml Keluar</th><th>Lama Dirawat</th><th>Hari Perawatan</th><th>Utama/VIP</th><th>Kls I</th><th>Kls II</th><th>Kls IIIA</th><th>Kls IIIB</th><th>Pasien Sisa</th><th>Max Sensus</th><th>BOR%</th></tr>';
  let totalAwal = 0, totalMasuk = 0, totalPindahMasuk = 0, totalPindahKeluar = 0, totalHidup = 0, totalM1 = 0, totalM2 = 0, totalKeluar = 0, totalLama = 0, totalHP = 0, totalSisa = 0, totalTT = 0;
  const totalKelas = { 'Utama/VIP': 0, 'I': 0, 'II': 0, 'IIIA': 0, 'IIIB': 0 };

  daftarDept.forEach((dept, i) => {
    const r = hitungSensusDepartemen(semua, dept, awal, akhir);
    const tt = konfigTT[dept] || 0;
    const bor = tt > 0 ? ((r.totalHariPerawatan / (tt * jumlahHari)) * 100).toFixed(1) : '-';
    html += `<tr>
      <td>${i + 1}</td><td>${dept}</td><td>${tt || '-'}</td>
      <td>${r.pasienAwalPeriode}</td><td>${r.masukPeriode}</td><td>${r.pindahanMasuk}</td><td>${r.pindahanKeluar}</td><td>${r.keluarHidup}</td>
      <td>${r.mati48K}</td><td>${r.mati48L}</td><td>${r.jumlahKeluar}</td><td>${r.lamaDirawat}</td>
      <td>${r.totalHariPerawatan}</td>
      <td>${r.sisaPerKelas['Utama/VIP']}</td><td>${r.sisaPerKelas['I']}</td><td>${r.sisaPerKelas['II']}</td><td>${r.sisaPerKelas['IIIA']}</td><td>${r.sisaPerKelas['IIIB']}</td>
      <td>${r.pasienSisa}</td><td>${r.maxSensusHarian}</td><td>${bor}</td>
    </tr>`;
    totalAwal += r.pasienAwalPeriode; totalMasuk += r.masukPeriode; totalPindahMasuk += r.pindahanMasuk; totalPindahKeluar += r.pindahanKeluar; totalHidup += r.keluarHidup;
    totalM1 += r.mati48K; totalM2 += r.mati48L; totalKeluar += r.jumlahKeluar; totalLama += r.lamaDirawat;
    totalHP += r.totalHariPerawatan; totalSisa += r.pasienSisa; totalTT += tt;
    Object.keys(totalKelas).forEach(k => totalKelas[k] += r.sisaPerKelas[k]);
  });

  const borTotal = totalTT > 0 ? ((totalHP / (totalTT * jumlahHari)) * 100).toFixed(1) : '-';
  html += `<tr style="font-weight:700; background:#f5f5f5;">
    <td colspan="2">TOTAL</td><td>${totalTT}</td>
    <td>${totalAwal}</td><td>${totalMasuk}</td><td>${totalPindahMasuk}</td><td>${totalPindahKeluar}</td><td>${totalHidup}</td>
    <td>${totalM1}</td><td>${totalM2}</td><td>${totalKeluar}</td><td>${totalLama}</td>
    <td>${totalHP}</td>
    <td>${totalKelas['Utama/VIP']}</td><td>${totalKelas['I']}</td><td>${totalKelas['II']}</td><td>${totalKelas['IIIA']}</td><td>${totalKelas['IIIB']}</td>
    <td>${totalSisa}</td><td>-</td><td>${borTotal}</td>
  </tr>`;

  document.getElementById('tabelRL1').innerHTML = html;
  document.getElementById('rl1PeriodeInfo').textContent = `Periode: ${awal} s/d ${akhir} (${jumlahHari} hari)`;
  document.getElementById('rl1Section').style.display = 'block';
  document.getElementById('rl1Section').scrollIntoView({ behavior: 'smooth' });
});

document.getElementById('btnCetakRL1').addEventListener('click', function () {
  cetakTabel('tabelRL1', 'Laporan RL1 - Data Kegiatan Rawat Inap per Departemen');
});

document.getElementById('btnCetakRekapBulanan').addEventListener('click', function () {
  cetakTabel('tabelRekapBulanan', 'Rekap per Bulan (Data Triwulan)');
});

const KUNCI_BACKUP = ['dataPasienPulang', 'konfigTTDepartemen', 'jumlahTempatTidurRS'];

document.getElementById('btnDownloadBackup').addEventListener('click', function () {
  const backup = {
    dibuatPada: new Date().toISOString(),
    aplikasi: 'Sistem Informasi Rawat Inap',
    data: {}
  };

  KUNCI_BACKUP.forEach(kunci => {
    const nilai = localStorage.getItem(kunci);
    if (nilai !== null) {
      try { backup.data[kunci] = JSON.parse(nilai); }
      catch (e) { backup.data[kunci] = nilai; }
    }
  });

  const jumlahPasien = (backup.data.dataPasienPulang || []).length;
  if (jumlahPasien === 0) {
    alert('Belum ada data pasien untuk di-backup.');
    return;
  }

  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const tanggal = new Date().toISOString().slice(0, 10);
  const a = document.createElement('a');
  a.href = url;
  a.download = `backup-siri-${tanggal}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  localStorage.setItem('backupTerakhir', new Date().toLocaleString('id-ID'));
  tampilkanInfoBackupTerakhir();
});

document.getElementById('inputUploadBackup').addEventListener('change', function (e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (event) {
    let backup;
    try {
      backup = JSON.parse(event.target.result);
    } catch (err) {
      alert('File tidak valid. Pastikan kamu memilih file backup .json yang benar dari website ini.');
      return;
    }

    const NAMA_APLIKASI_VALID = ['Sistem Informasi Rawat Inap', 'SIRI - Sistem Indikator Rawat Inap'];
    if (!backup.data || !backup.aplikasi || !NAMA_APLIKASI_VALID.includes(backup.aplikasi)) {
      alert('File ini bukan file backup Sistem Informasi Rawat Inap yang valid.');
      return;
    }

    const jumlahPasienBaru = (backup.data.dataPasienPulang || []).length;
    const jumlahPasienSekarang = ambilDataPasien().length;
    const konfirmasi = confirm(
      `File backup ini dibuat pada: ${new Date(backup.dibuatPada).toLocaleString('id-ID')}\n` +
      `Berisi ${jumlahPasienBaru} data pasien.\n\n` +
      `Data yang sekarang ada di website ini (${jumlahPasienSekarang} pasien) akan DITIMPA dengan data dari file ini. Lanjutkan?`
    );
    if (!konfirmasi) return;

    KUNCI_BACKUP.forEach(kunci => {
      if (backup.data[kunci] !== undefined) {
        const nilai = backup.data[kunci];
        localStorage.setItem(kunci, typeof nilai === 'string' ? nilai : JSON.stringify(nilai));
      }
    });

    renderTabelPasienAktif();
    renderTabelPasien();
    renderTabelPenyakit();
    renderBeranda();
    muatPengaturanTT();
    alert('Data berhasil dipulihkan dari backup.');
    e.target.value = '';
  };
  reader.readAsText(file);
});

function tampilkanInfoBackupTerakhir() {
  const waktu = localStorage.getItem('backupTerakhir');
  const el = document.getElementById('infoBackupTerakhir');
  el.textContent = waktu ? `Backup terakhir: ${waktu}` : 'Belum pernah backup.';
}

renderTabelPasienAktif();
renderTabelPasien();
renderTabelPenyakit();
renderBeranda();
tampilkanInfoBackupTerakhir();
muatPengaturanTT();
muatPeriodeSensusTersimpan();

(function muatIndikatorTersimpan() {
  const saved = JSON.parse(localStorage.getItem(KUNCI_LAST_INDIKATOR) || 'null');
  if (!saved) return;
  document.getElementById('tempatTidur').value = saved.tempatTidur;
  document.getElementById('periode').value = saved.periode;
  document.getElementById('hariPerawatan').value = saved.hariPerawatan;
  document.getElementById('lamaDirawat').value = saved.lamaDirawat ?? saved.hariPerawatan;
  document.getElementById('pasienKeluar').value = saved.pasienKeluar;
  try {
    document.getElementById('hitungForm').requestSubmit();
  } catch (e) {
  }
})();

// ============================================================
// API Endpoints
// ============================================================
const API_TRANSAKSI = "/api/transaksi";
const API_ANGGOTA = "/api/anggota";
const API_POS = "/api/pos-pengeluaran";
const API_PERIODE = "/api/periode-keuangan";
const API_TARIF = "/api/tarif-iuran";
const API_EVENT = "/api/event-anggaran";

// State Data Global
let dataTransaksiList = [];
let dataAnggotaList = [];
let dataPosList = [];
let dataPeriodeList = [];
let dataTarifList = [];
let dataEventList = [];

// ============================================================
// Utility / Helper Functions
// ============================================================

const formatRupiah = angka =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0
  }).format(angka || 0);

// Format ringkas (misal: 1.2M, 500K) seperti di mockup dashboard
const formatRingkas = angka => {
  const num = Math.abs(Number(angka) || 0);
  if (num >= 1_000_000_000) return (angka / 1_000_000_000).toFixed(1) + "M";
  if (num >= 1_000_000) return (angka / 1_000_000).toFixed(1) + "M";
  if (num >= 1_000) return (angka / 1_000).toFixed(0) + "K";
  return String(angka);
};

const formatWaktu = waktu => {
  if (!waktu) return "-";
  const iso = typeof waktu === "string" ? waktu.replace(" ", "T") : waktu;
  const tanggal = new Date(iso);
  if (isNaN(tanggal.getTime())) return "-";

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(tanggal);
};

const namaBulanIndo = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

const singkatanBulan = [
  "JAN", "FEB", "MAR", "APR", "MEI", "JUN",
  "JUL", "AGU", "SEP", "OKT", "NOV", "DES"
];

// ============================================================
// 1. MANAJEMEN TABS & SIDEBAR
// ============================================================

function inisialisasiNavigation() {
  const navButtons = document.querySelectorAll(".nav-item-btn[data-tab]");
  const tabContents = document.querySelectorAll(".tab-content");
  const pageTitle = document.getElementById("pageTitle");

  navButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      const targetId = btn.getAttribute("data-tab");

      navButtons.forEach(b => b.classList.remove("active"));
      tabContents.forEach(c => c.classList.remove("active"));

      btn.classList.add("active");
      const targetContent = document.getElementById(targetId);
      if (targetContent) targetContent.classList.add("active");

      // Update Judul Halaman di Topbar
      const icon = btn.querySelector(".nav-icon")?.textContent || "📄";
      const title = btn.querySelector("span:not(.nav-icon)")?.textContent || "Menu";
      if (pageTitle) pageTitle.innerHTML = `<span>${icon}</span><span>${title}</span>`;

      // Tutup sidebar di mobile
      tutupSidebarMobile();

      // Refresh data jika diperlukan
      if (targetId === "tab-transaksi") tampilkanTransaksi();
      if (targetId === "tab-anggota") tampilkanAnggota();
      if (targetId === "tab-pos") tampilkanPos();
      if (targetId === "tab-event") {
        tampilkanEvent();
        muatDropdownPeriode();
      }
      if (targetId === "tab-settings") {
        tampilkanPeriode();
        muatTarifIuran();
      }
      if (targetId === "tab-overview") renderDashboardOverview();
    });
  });

  // Mobile Toggle
  const btnToggle = document.getElementById("btnToggleSidebar");
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("sidebarOverlay");

  if (btnToggle && sidebar && overlay) {
    btnToggle.addEventListener("click", () => {
      sidebar.classList.toggle("open");
      overlay.classList.toggle("open");
    });

    overlay.addEventListener("click", tutupSidebarMobile);
  }
}

function tutupSidebarMobile() {
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("sidebarOverlay");
  if (sidebar) sidebar.classList.remove("open");
  if (overlay) overlay.classList.remove("open");
}

// Shortcut Ctrl+K untuk Search
window.addEventListener("keydown", e => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
    e.preventDefault();
    const searchInput = document.getElementById("quickSearchInput");
    if (searchInput) searchInput.focus();
  }
});

// Quick Search handler
const quickSearch = document.getElementById("quickSearchInput");
if (quickSearch) {
  quickSearch.addEventListener("input", e => {
    const query = e.target.value.toLowerCase().trim();
    // Beralih ke tab transaksi jika sedang mengetik
    if (query.length > 0) {
      const btnTx = document.querySelector('.nav-item-btn[data-tab="tab-transaksi"]');
      if (btnTx && !btnTx.classList.contains("active")) {
        btnTx.click();
      }
      const searchTx = document.getElementById("searchTransaksiInput");
      if (searchTx) {
        searchTx.value = query;
        filterTableTransaksi(query);
      }
    }
  });
}

// ============================================================
// 2. MODAL TRANSAKSI CONTROLLER
// ============================================================

function bukaModalTransaksi(mode = "tambah") {
  const modal = document.getElementById("modalTransaksi");
  if (!modal) return;

  if (mode === "tambah") {
    resetFormTransaksi();
    document.getElementById("judulModalTransaksi").textContent = "Catat Transaksi Kas";
    document.getElementById("tombolSimpan").textContent = "Simpan Transaksi";

    // Set tanggal default hari ini
    const tglInput = document.getElementById("tanggal");
    if (tglInput && !tglInput.value) {
      tglInput.value = new Date().toISOString().slice(0, 10);
    }
  }

  modal.classList.add("open");
}

function tutupModalTransaksi() {
  const modal = document.getElementById("modalTransaksi");
  if (modal) modal.classList.remove("open");
}

// Tutup modal jika klik di luar area modal box
const modalTx = document.getElementById("modalTransaksi");
if (modalTx) {
  modalTx.addEventListener("click", e => {
    if (e.target === modalTx) tutupModalTransaksi();
  });
}

// ============================================================
// 3. DROPDOWN MASTER DATA UNTUK FORM TRANSAKSI
// ============================================================

async function muatDropdownAnggota() {
  try {
    const res = await fetch(API_ANGGOTA);
    if (!res.ok) throw new Error("Gagal mengambil daftar anggota");
    dataAnggotaList = await res.json();

    const select = document.getElementById("anggotaId");
    if (!select) return;

    const selectedVal = select.value;
    select.innerHTML = '<option value="">-- Pilih Anggota --</option>';

    dataAnggotaList
      .filter(a => a.status === "aktif")
      .forEach(a => {
        const opt = document.createElement("option");
        opt.value = a.id;
        opt.textContent = a.nomor_anggota ? `${a.nama} (${a.nomor_anggota})` : a.nama;
        select.appendChild(opt);
      });

    select.value = selectedVal;
  } catch (err) {
    console.error("muatDropdownAnggota:", err);
  }
}

async function muatDropdownPos() {
  try {
    const res = await fetch(API_POS);
    if (!res.ok) throw new Error("Gagal mengambil daftar pos");
    dataPosList = await res.json();

    const select = document.getElementById("posPengeluaranId");
    if (!select) return;

    const selectedVal = select.value;
    select.innerHTML = '<option value="">-- Pilih Pos Pengeluaran --</option>';

    dataPosList.forEach(p => {
      const opt = document.createElement("option");
      opt.value = p.id;
      opt.textContent = p.nama_pos;
      select.appendChild(opt);
    });

    select.value = selectedVal;
  } catch (err) {
    console.error("muatDropdownPos:", err);
  }
}

// ============================================================
// 4. FORM DINAMIS (Pemasukan vs Pengeluaran)
// ============================================================

function getJenisValue() {
  const checked = document.querySelector('input[name="jenis"]:checked');
  return checked ? checked.value : "masuk";
}

function setJenisValue(val) {
  const radio = document.querySelector(`input[name="jenis"][value="${val}"]`);
  if (radio) {
    radio.checked = true;
    radio.dispatchEvent(new Event("change", { bubbles: true }));
  }
}

function inisialisasiFormDinamis() {
  const radioGroup = document.getElementById("jenis");
  const subjekMasukSelect = document.getElementById("subjekMasuk");
  const groupSubjekMasuk = document.getElementById("groupSubjekMasuk");
  const groupAnggota = document.getElementById("groupAnggota");
  const groupPos = document.getElementById("groupPosPengeluaran");

  function aturTampilanForm() {
    const jenis = getJenisValue();

    if (jenis === "masuk") {
      groupSubjekMasuk.style.display = "";
      groupPos.style.display = "none";

      const subjek = subjekMasukSelect.value;
      if (subjek === "Iuran Keanggotaan" || subjek === "Pendaftaran Anggota") {
        groupAnggota.style.display = "";
      } else {
        groupAnggota.style.display = "none";
        document.getElementById("anggotaId").value = "";
      }
    } else {
      groupSubjekMasuk.style.display = "none";
      groupAnggota.style.display = "none";
      groupPos.style.display = "";
      document.getElementById("anggotaId").value = "";
    }
  }

  if (radioGroup) radioGroup.addEventListener("change", aturTampilanForm);
  if (subjekMasukSelect) subjekMasukSelect.addEventListener("change", aturTampilanForm);

  // Auto-fill nominal iuran saat anggota dipilih pada transaksi iuran
  const anggotaSelect = document.getElementById("anggotaId");
  if (anggotaSelect) {
    anggotaSelect.addEventListener("change", () => {
      const subjek = subjekMasukSelect?.value;
      if (subjek === "Iuran Keanggotaan" && anggotaSelect.value) {
        const member = dataAnggotaList.find(a => String(a.id) === String(anggotaSelect.value));
        if (member) {
          const statusMember = member.status || "aktif";
          const tarif = dataTarifList.find(t => t.status_anggota === statusMember);
          if (tarif) {
            const inputJumlah = document.getElementById("jumlah");
            if (inputJumlah) inputJumlah.value = tarif.nominal;
            const inputKet = document.getElementById("keterangan");
            if (inputKet && (!inputKet.value || inputKet.value.startsWith("Iuran kas bulanan"))) {
              inputKet.value = `Iuran kas bulanan - ${member.nama}`;
            }
          }
        }
      }
    });
  }

  aturTampilanForm();
}

// ============================================================
// 5. RENDER DASHBOARD OVERVIEW (PERSIS DESAIN FINTECH SAAS)
// ============================================================

function inisialisasiFilterBulan() {
  const inputBulan = document.getElementById("filterBulan");
  if (inputBulan && !inputBulan.value) {
    const sekarang = new Date();
    const tahun = sekarang.getFullYear();
    const bulan = String(sekarang.getMonth() + 1).padStart(2, "0");
    inputBulan.value = `${tahun}-${bulan}`;
  }
}

function renderDashboardOverview() {
  const inputBulan = document.getElementById("filterBulan");
  const periodeStr = inputBulan ? inputBulan.value : "";
  const [tahunPilih, bulanPilih] = periodeStr ? periodeStr.split("-").map(Number) : [new Date().getFullYear(), new Date().getMonth() + 1];

  const namaBulanAktif = namaBulanIndo[bulanPilih - 1] || "Bulan Ini";

  // Filter Data Bulan Terpilih
  const txBulan = dataTransaksiList.filter(t =>
    typeof t.tanggal === "string" && t.tanggal.startsWith(periodeStr)
  );

  const txMasukBulan = txBulan.filter(t => t.jenis === "masuk");
  const txKeluarBulan = txBulan.filter(t => t.jenis === "keluar");

  const totalMasukBulan = txMasukBulan.reduce((acc, t) => acc + Number(t.jumlah), 0);
  const totalKeluarBulan = txKeluarBulan.reduce((acc, t) => acc + Number(t.jumlah), 0);
  const netBulan = totalMasukBulan - totalKeluarBulan;

  // Akumulasi Seluruh Periode
  const totalMasukSemua = dataTransaksiList
    .filter(t => t.jenis === "masuk")
    .reduce((acc, t) => acc + Number(t.jumlah), 0);
  const totalKeluarSemua = dataTransaksiList
    .filter(t => t.jenis === "keluar")
    .reduce((acc, t) => acc + Number(t.jumlah), 0);
  const saldoTotalSemua = totalMasukSemua - totalKeluarSemua;

  // 1. Update Hero Section
  const heroTitle = document.getElementById("heroTitle");
  const heroSubtitle = document.getElementById("heroSubtitle");

  if (heroTitle) heroTitle.textContent = `Catatan Kas — ${namaBulanAktif} ${tahunPilih}`;
  if (heroSubtitle) {
    const rasioPct = totalMasukBulan > 0 ? Math.round((totalKeluarBulan / totalMasukBulan) * 100) : 0;
    heroSubtitle.innerHTML = `
      <span><span class="is-number">${formatRupiah(totalMasukBulan)}</span> pemasukan MTD</span>
      <span class="hero-bullet"><i class="hgi hgi-stroke hgi-rounded hgi-dot"></i></span>
      <span><span class="is-number">${rasioPct}%</span> realisasi belanja</span>
      <span class="hero-bullet"><i class="hgi hgi-stroke hgi-rounded hgi-dot"></i></span>
      <span><span class="is-number">${txBulan.length}</span> transaksi tercatat</span>
    `;
  }

  // 2. Update Row 1: 4 KPI Cards
  const elKpiSaldo = document.getElementById("kpiSaldoTotal");
  const elKpiMasuk = document.getElementById("kpiMasukBulan");
  const elKpiKeluar = document.getElementById("kpiKeluarBulan");
  const elKpiNet = document.getElementById("kpiNetBulan");
  const elKpiJmlMasuk = document.getElementById("kpiJumlahTxMasuk");
  const elKpiJmlKeluar = document.getElementById("kpiJumlahTxKeluar");
  const elKpiStatus = document.getElementById("kpiStatusRasio");

  if (elKpiSaldo) elKpiSaldo.textContent = formatRupiah(saldoTotalSemua);
  if (elKpiMasuk) elKpiMasuk.textContent = formatRupiah(totalMasukBulan);
  if (elKpiKeluar) elKpiKeluar.textContent = formatRupiah(totalKeluarBulan);
  if (elKpiNet) elKpiNet.textContent = formatRupiah(netBulan);
  if (elKpiJmlMasuk) elKpiJmlMasuk.textContent = `${txMasukBulan.length} transaksi`;
  if (elKpiJmlKeluar) elKpiJmlKeluar.textContent = `${txKeluarBulan.length} transaksi`;

  if (elKpiStatus) {
    if (netBulan >= 0) {
      elKpiStatus.textContent = "Surplus";
      elKpiStatus.className = "trend-badge down";
    } else {
      elKpiStatus.textContent = "Defisit";
      elKpiStatus.className = "trend-badge up";
    }
  }

  // 3. Update Row 2: 12-Month Pill Bar Chart
  render12MonthPillChart(tahunPilih, bulanPilih);

  // 4. Update Row 2: Health Card
  renderHealthCard(totalMasukBulan, totalKeluarBulan, netBulan, tahunPilih, bulanPilih);

  // 5. Update Row 3: Spend By Category
  renderCategorySpendTable(txKeluarBulan, totalKeluarBulan);

  // 6. Update Row 3: Recent Activity
  renderRecentActivityFeed();
}

// 12-Month Pill Bar Chart Renderer
function render12MonthPillChart(tahunAktif, bulanAktif) {
  const container = document.getElementById("pillChartContainer");
  if (!container) return;
  container.innerHTML = "";

  // Hitung pengeluaran / perputaran per bulan untuk tahunAktif (1..12)
  const monthlyTotals = Array(12).fill(0);
  dataTransaksiList.forEach(t => {
    if (typeof t.tanggal === "string") {
      const [y, m] = t.tanggal.split("-").map(Number);
      if (y === tahunAktif && m >= 1 && m <= 12) {
        monthlyTotals[m - 1] += Number(t.jumlah);
      }
    }
  });

  const maxTotal = Math.max(...monthlyTotals, 1);
  const totalTahunSemua = monthlyTotals.reduce((a, b) => a + b, 0);

  const chartTotalTahun = document.getElementById("chartTotalTahun");
  const chartBadgeBulan = document.getElementById("chartBadgeBulan");
  if (chartTotalTahun) chartTotalTahun.textContent = formatRupiah(totalTahunSemua);
  if (chartBadgeBulan) chartBadgeBulan.textContent = `${singkatanBulan[bulanAktif - 1]} ${tahunAktif}`;

  // Buat 12 Pillar Bar
  for (let i = 0; i < 12; i++) {
    const bulanIndex = i + 1;
    const totalBulan = monthlyTotals[i];
    const pct = Math.round((totalBulan / maxTotal) * 100);
    const heightBar = Math.max(pct, 12); // minimal tinggi agar terlihat pill
    const isCurrent = bulanIndex === bulanAktif;

    const col = document.createElement("div");
    col.className = `chart-col ${isCurrent ? "active" : ""}`;

    // Bar Pill
    const pill = document.createElement("div");
    pill.className = "bar-pill";
    pill.style.height = `${heightBar}%`;

    // Persentase teks di dalam bar
    const pctLabel = document.createElement("span");
    pctLabel.className = "bar-pct";
    pctLabel.textContent = `${pct}%`;
    pill.appendChild(pctLabel);

    // Floating Tooltip untuk bulan aktif
    if (isCurrent) {
      const tooltip = document.createElement("div");
      tooltip.className = "floating-tooltip";
      tooltip.textContent = formatRingkas(totalBulan);
      pill.appendChild(tooltip);
    }

    // Label Bulan di bawah
    const label = document.createElement("div");
    label.className = `col-label ${isCurrent ? "active" : ""}`;
    label.textContent = singkatanBulan[i];

    col.appendChild(pill);
    col.appendChild(label);

    // Interaktif: Klik bar untuk mengganti periode bulan terpilih
    col.style.cursor = "pointer";
    col.onclick = () => {
      const filterBulan = document.getElementById("filterBulan");
      if (filterBulan) {
        const blnStr = String(bulanIndex).padStart(2, "0");
        filterBulan.value = `${tahunAktif}-${blnStr}`;
        renderDashboardOverview();
      }
    };

    container.appendChild(col);
  }
}

// Health Card Renderer
function renderHealthCard(masuk, keluar, net, tahun, bulan) {
  const elSaldoSisa = document.getElementById("healthSaldoSisa");
  const elProgressBar = document.getElementById("healthProgressBar");
  const elUsed = document.getElementById("pctKeluarUsed");
  const elRemaining = document.getElementById("pctSisaRemaining");
  const elPeriod = document.getElementById("healthPeriodLabel");

  if (elPeriod) elPeriod.textContent = `${namaBulanIndo[bulan - 1]} MTD`;

  const sisa = Math.max(net, 0);
  if (elSaldoSisa) elSaldoSisa.textContent = formatRupiah(sisa);

  // Rasio Pengeluaran terhadap Pemasukan
  const rasioUsed = masuk > 0 ? Math.min(Math.round((keluar / masuk) * 100), 100) : 0;
  const rasioRemain = 100 - rasioUsed;

  if (elProgressBar) elProgressBar.style.width = `${rasioUsed}%`;
  if (elUsed) elUsed.textContent = `${rasioUsed}% terpakai`;
  if (elRemaining) elRemaining.textContent = `${rasioRemain}% tersisa`;

  // Item List
  const hlMasuk = document.getElementById("hlMasuk");
  const hlKeluar = document.getElementById("hlKeluar");
  const hlSurplus = document.getElementById("hlSurplus");
  const hlHariSisa = document.getElementById("hlHariSisa");

  if (hlMasuk) hlMasuk.textContent = formatRupiah(masuk);
  if (hlKeluar) hlKeluar.textContent = formatRupiah(keluar);
  if (hlSurplus) {
    hlSurplus.textContent = formatRupiah(net);
    hlSurplus.style.color = net >= 0 ? "#059669" : "#dc2626";
  }

  // Hitung sisa hari dalam bulan tersebut
  const totalHariDalamBulan = new Date(tahun, bulan, 0).getDate();
  const sekarang = new Date();
  let sisaHari = 0;
  if (sekarang.getFullYear() === tahun && sekarang.getMonth() + 1 === bulan) {
    sisaHari = Math.max(totalHariDalamBulan - sekarang.getDate(), 0);
  } else {
    sisaHari = totalHariDalamBulan;
  }
  if (hlHariSisa) hlHariSisa.textContent = `${sisaHari} hari`;
}

// Spend By Category Table Renderer
function renderCategorySpendTable(txKeluarBulan, totalKeluarBulan) {
  const tbody = document.getElementById("kategoriSpendBody");
  if (!tbody) return;
  tbody.innerHTML = "";

  if (txKeluarBulan.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" class="cat-amount">Belum ada pengeluaran di bulan ini</td></tr>';
    return;
  }

  // Agregasi per pos pengeluaran
  const catMap = {};
  txKeluarBulan.forEach(t => {
    const key = t.nama_pos_pengeluaran || t.subjek || "Lain-lain";
    catMap[key] = (catMap[key] || 0) + Number(t.jumlah);
  });

  const colors = ["#2563eb", "#8b5cf6", "#06b6d4", "#f59e0b", "#ec4899", "#10b981"];
  let idx = 0;

  Object.entries(catMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .forEach(([namaPos, jumlah]) => {
      const pct = totalKeluarBulan > 0 ? Math.round((jumlah / totalKeluarBulan) * 100) : 0;
      const dotColor = colors[idx % colors.length];
      idx++;

      let tagClass = "safe";
      let tagText = "Normal";
      if (pct > 50) { tagClass = "over"; tagText = "Tinggi"; }
      else if (pct > 25) { tagClass = "watch"; tagText = "Sedang"; }

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>
          <div class="cat-name-cell">
            <span class="cat-dot" style="background-color: ${dotColor};"></span>
            <span>${namaPos}</span>
          </div>
        </td>
        <td>
          <span class="cat-amount">${formatRupiah(jumlah)}</span>
        </td>
        <td>
          <span class="cat-amount">${pct}%</span>
        </td>
        <td>
          <span class="cat-tag ${tagClass}">${tagText}</span>
        </td>
      `;
      tbody.appendChild(tr);
    });
}

// Recent Activity Feed Renderer
function renderRecentActivityFeed() {
  const container = document.getElementById("recentActivityList");
  if (!container) return;
  container.innerHTML = "";

  const recent = dataTransaksiList.slice(0, 5);

  if (recent.length === 0) {
    container.innerHTML = '<div style="text-align:center;color:#94a3b8;padding:1.5rem;">Belum ada transaksi tercatat</div>';
    return;
  }

  recent.forEach(t => {
    const item = document.createElement("div");
    item.className = "activity-item";

    const isMasuk = t.jenis === "masuk";
    const pihak = isMasuk ? (t.nama_anggota || "Umum") : (t.nama_pos_pengeluaran || "Operasional");

    item.innerHTML = `
      <div class="act-bullet ${t.jenis}"></div>
      <div class="act-content">
        <div class="act-title">
          <span>${t.keterangan}</span>
          <span class="act-highlight">(${pihak})</span>
        </div>
        <div class="act-meta">
          <span class="is-number">${t.tanggal}</span> <span class="dot-small"><i class="hgi hgi-stroke hgi-rounded hgi-dot"></i></span> <span>${t.subjek || (isMasuk ? "Pemasukan" : "Pengeluaran")}</span>
        </div>
      </div>
      <div class="act-amount ${t.jenis}">
        ${isMasuk ? "+" : "-"}${formatRupiah(t.jumlah)}
      </div>
    `;

    container.appendChild(item);
  });
}

// ============================================================
// 6. CRUD TRANSAKSI KAS
// ============================================================

async function tampilkanTransaksi() {
  try {
    const response = await fetch(API_TRANSAKSI);
    if (!response.ok) throw new Error("Gagal mengambil data transaksi");

    dataTransaksiList = await response.json();

    // Render Overview & Dashboard
    renderDashboardOverview();

    // Render Tabel Lengkap di Tab Transaksi
    const tabel = document.getElementById("daftarTransaksi");
    if (!tabel) return;
    tabel.innerHTML = "";

    dataTransaksiList.forEach(t => {
      const baris = document.createElement("tr");

      let pihakTerkait = "-";
      if (t.jenis === "masuk" && t.nama_anggota) {
        pihakTerkait = t.nomor_anggota ? `${t.nama_anggota} (${t.nomor_anggota})` : t.nama_anggota;
      } else if (t.jenis === "keluar" && t.nama_pos_pengeluaran) {
        pihakTerkait = t.nama_pos_pengeluaran;
      }

      const belumDiupdate = !t.updated_at || t.updated_at === t.created_at;
      const teksDiperbarui = belumDiupdate ? "-" : formatWaktu(t.updated_at);

      const kolom = [
        { label: "Tanggal", nilai: t.tanggal },
        { label: "Keterangan", nilai: t.keterangan },
        { label: "Jenis", nilai: t.jenis === "masuk" ? "Pemasukan" : "Pengeluaran" },
        { label: "Subjek", nilai: t.subjek || "-" },
        { label: "Pihak / Pos", nilai: pihakTerkait },
        { label: "Jumlah", nilai: formatRupiah(t.jumlah) },
        { label: "Dibuat", nilai: formatWaktu(t.created_at) },
        { label: "Diperbarui", nilai: teksDiperbarui }
      ];

      kolom.forEach(item => {
        const td = document.createElement("td");
        td.textContent = item.nilai;
        td.setAttribute("data-label", item.label);
        baris.appendChild(td);
      });

      // Aksi
      const aksi = document.createElement("td");
      aksi.setAttribute("data-label", "Aksi");

      const aksiWrapper = document.createElement("div");
      aksiWrapper.className = "aksi-wrapper";

      const tombolEdit = document.createElement("button");
      tombolEdit.textContent = "Edit";
      tombolEdit.className = "btn btn-xs btn-soft-primary";
      tombolEdit.onclick = () => editTransaksi(t.id);

      const tombolHapus = document.createElement("button");
      tombolHapus.textContent = "Hapus";
      tombolHapus.className = "btn btn-xs btn-soft-danger";
      tombolHapus.onclick = () => hapusTransaksi(t.id);

      aksiWrapper.appendChild(tombolEdit);
      aksiWrapper.appendChild(tombolHapus);
      aksi.appendChild(aksiWrapper);

      baris.appendChild(aksi);
      tabel.appendChild(baris);
    });

  } catch (error) {
    console.error("Gagal menampilkan transaksi:", error);
  }
}

function filterTableTransaksi(keyword) {
  const rows = document.querySelectorAll("#daftarTransaksi tr");
  rows.forEach(r => {
    const text = r.textContent.toLowerCase();
    r.style.display = text.includes(keyword) ? "" : "none";
  });
}

const searchTxInput = document.getElementById("searchTransaksiInput");
if (searchTxInput) {
  searchTxInput.addEventListener("input", e => {
    filterTableTransaksi(e.target.value.toLowerCase().trim());
  });
}

async function editTransaksi(id) {
  try {
    const response = await fetch(`${API_TRANSAKSI}/${id}`);
    const data = await response.json();

    if (!response.ok) {
      alert(data.pesan || "Transaksi tidak ditemukan");
      return;
    }

    document.getElementById("idTransaksi").value = data.id;
    document.getElementById("tanggal").value = data.tanggal;
    document.getElementById("keterangan").value = data.keterangan;
    setJenisValue(data.jenis);
    document.getElementById("jumlah").value = data.jumlah;

    if (data.jenis === "masuk") {
      const subjekMasuk = document.getElementById("subjekMasuk");
      if (subjekMasuk) {
        subjekMasuk.value = data.subjek || "Iuran Keanggotaan";
        subjekMasuk.dispatchEvent(new Event("change"));
      }
      if (data.anggota_id) {
        document.getElementById("anggotaId").value = data.anggota_id;
      }
    } else {
      if (data.pos_pengeluaran_id) {
        document.getElementById("posPengeluaranId").value = data.pos_pengeluaran_id;
      }
    }

    const selEvent = document.getElementById("transaksiEventId");
    if (selEvent) selEvent.value = data.event_id || "";

    document.getElementById("judulModalTransaksi").textContent = "Edit Transaksi Kas";
    document.getElementById("tombolSimpan").textContent = "Update Transaksi";

    bukaModalTransaksi("edit");
  } catch (error) {
    console.error("Gagal mengambil transaksi:", error);
    alert("Terjadi kesalahan saat mengambil transaksi");
  }
}

function resetFormTransaksi() {
  const form = document.getElementById("formTransaksi");
  if (form) form.reset();
  document.getElementById("idTransaksi").value = "";
  const selEvent = document.getElementById("transaksiEventId");
  if (selEvent) selEvent.value = "";
  setJenisValue("masuk");
}

document.getElementById("formTransaksi").addEventListener("submit", async event => {
  event.preventDefault();

  const id = document.getElementById("idTransaksi").value;
  const jenis = getJenisValue();

  let subjek = null;
  let anggota_id = null;
  let pos_pengeluaran_id = null;

  if (jenis === "masuk") {
    subjek = document.getElementById("subjekMasuk").value;
    const selectedAnggota = document.getElementById("anggotaId").value;
    if (selectedAnggota) anggota_id = Number(selectedAnggota);
  } else {
    const selectedPos = document.getElementById("posPengeluaranId").value;
    if (selectedPos) {
      pos_pengeluaran_id = Number(selectedPos);
      const posObj = dataPosList.find(p => p.id === pos_pengeluaran_id);
      subjek = posObj ? posObj.nama_pos : "Pengeluaran";
    } else {
      subjek = "Pengeluaran Umum";
    }
  }

  const selectedEvent = document.getElementById("transaksiEventId")?.value;
  const event_id = selectedEvent ? Number(selectedEvent) : null;

  const payload = {
    tanggal: document.getElementById("tanggal").value,
    keterangan: document.getElementById("keterangan").value,
    jenis,
    jumlah: document.getElementById("jumlah").value,
    subjek,
    anggota_id,
    pos_pengeluaran_id,
    event_id
  };

  try {
    const response = await fetch(
      id ? `${API_TRANSAKSI}/${id}` : API_TRANSAKSI,
      {
        method: id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      }
    );

    const hasil = await response.json();
    if (!response.ok) {
      alert(hasil.pesan || "Gagal menyimpan transaksi");
      return;
    }

    alert(hasil.pesan || "Transaksi berhasil disimpan");
    tutupModalTransaksi();
    resetFormTransaksi();
    await tampilkanTransaksi();
  } catch (error) {
    console.error("Gagal menyimpan transaksi:", error);
    alert("Terjadi kesalahan saat menyimpan transaksi");
  }
});

async function hapusTransaksi(id) {
  if (!confirm("Hapus transaksi ini?")) return;

  try {
    const response = await fetch(`${API_TRANSAKSI}/${id}`, { method: "DELETE" });
    const hasil = await response.json();

    if (!response.ok) {
      alert(hasil.pesan || "Gagal menghapus transaksi");
      return;
    }

    alert(hasil.pesan || "Transaksi berhasil dihapus");
    await tampilkanTransaksi();
  } catch (error) {
    console.error("Gagal menghapus transaksi:", error);
    alert("Terjadi kesalahan saat menghapus transaksi");
  }
}

// ============================================================
// 7. CRUD MASTER ANGGOTA (DENGAN STATUS & PENGALIHAN)
// ============================================================

function toggleFormPengalihanAnggota() {
  const statusEl = document.getElementById("statusAnggota");
  const wrap = document.getElementById("groupPengalihanWrap");
  if (!statusEl || !wrap) return;

  if (statusEl.value === "dialihkan") {
    wrap.style.display = "grid";
    const currentId = document.getElementById("idAnggota")?.value;
    const selectPengganti = document.getElementById("dialihkanKeId");
    if (selectPengganti) {
      const selectedVal = selectPengganti.value;
      selectPengganti.innerHTML = '<option value="">-- Pilih Anggota Pengganti --</option>';
      dataAnggotaList
        .filter(a => String(a.id) !== String(currentId))
        .forEach(a => {
          const opt = document.createElement("option");
          opt.value = a.id;
          opt.textContent = `${a.nomor_anggota ? a.nomor_anggota + " - " : ""}${a.nama}`;
          if (String(a.id) === String(selectedVal)) opt.selected = true;
          selectPengganti.appendChild(opt);
        });
    }
  } else {
    wrap.style.display = "none";
  }
}

async function tampilkanAnggota() {
  try {
    const res = await fetch(API_ANGGOTA);
    if (!res.ok) throw new Error("Gagal mengambil data anggota");

    dataAnggotaList = await res.json();
    const tabel = document.getElementById("daftarAnggota");
    if (!tabel) return;
    tabel.innerHTML = "";

    dataAnggotaList.forEach(a => {
      const baris = document.createElement("tr");

      let statusBadge = '<span class="badge-status aktif">Aktif</span>';
      if (a.status === "tidak_aktif" || a.status === "nonaktif") {
        statusBadge = '<span class="badge-status tidak_aktif">Tidak Aktif</span>';
      } else if (a.status === "dialihkan") {
        const targetNama = a.nama_dialihkan_ke || "Pengganti";
        const tglMulai = a.pengalihan_mulai ? a.pengalihan_mulai : "";
        const tglSelesai = a.pengalihan_selesai ? a.pengalihan_selesai : "";
        const rentang = (tglMulai || tglSelesai) ? `<br><small>${tglMulai} s/d ${tglSelesai}</small>` : "";
        statusBadge = `
          <div>
            <span class="badge-status dialihkan">Dialihkan</span>
            <span class="transfer-note">Ke: <strong>${targetNama}</strong>${rentang}</span>
          </div>
        `;
      }

      const kolom = [
        { label: "No. Anggota", nilai: a.nomor_anggota || "-" },
        { label: "Nama Lengkap", nilai: a.nama },
        { label: "Telepon", nilai: a.telepon || "-" },
        { label: "Status", nilai: statusBadge, isHtml: true },
        { label: "Dibuat", nilai: formatWaktu(a.created_at) }
      ];

      kolom.forEach(k => {
        const td = document.createElement("td");
        td.setAttribute("data-label", k.label);
        if (k.isHtml) {
          td.innerHTML = k.nilai;
        } else {
          td.textContent = k.nilai;
        }
        baris.appendChild(td);
      });

      const aksi = document.createElement("td");
      aksi.setAttribute("data-label", "Aksi");

      const wrapper = document.createElement("div");
      wrapper.className = "aksi-wrapper";

      const btnEdit = document.createElement("button");
      btnEdit.textContent = "Edit";
      btnEdit.className = "btn btn-xs btn-soft-primary";
      btnEdit.onclick = () => editAnggota(a.id);

      const btnHapus = document.createElement("button");
      btnHapus.textContent = "Hapus";
      btnHapus.className = "btn btn-xs btn-soft-danger";
      btnHapus.onclick = () => hapusAnggota(a.id);

      wrapper.appendChild(btnEdit);
      wrapper.appendChild(btnHapus);
      aksi.appendChild(wrapper);

      baris.appendChild(aksi);
      tabel.appendChild(baris);
    });

    await muatDropdownAnggota();
  } catch (err) {
    console.error("tampilkanAnggota:", err);
  }
}

async function editAnggota(id) {
  try {
    const res = await fetch(`${API_ANGGOTA}/${id}`);
    const data = await res.json();

    if (!res.ok) {
      alert(data.pesan || "Anggota tidak ditemukan");
      return;
    }

    document.getElementById("idAnggota").value = data.id;
    document.getElementById("nomorAnggota").value = data.nomor_anggota || "";
    document.getElementById("namaAnggota").value = data.nama;
    document.getElementById("teleponAnggota").value = data.telepon || "";
    document.getElementById("statusAnggota").value = data.status || "aktif";
    document.getElementById("pengalihanMulai").value = data.pengalihan_mulai || "";
    document.getElementById("pengalihanSelesai").value = data.pengalihan_selesai || "";
    document.getElementById("catatanPengalihan").value = data.catatan_pengalihan || "";

    toggleFormPengalihanAnggota();
    if (data.dialihkan_ke_id) {
      document.getElementById("dialihkanKeId").value = data.dialihkan_ke_id;
    }

    document.getElementById("judulFormAnggota").textContent = "Edit Data Anggota";
    document.getElementById("tombolSimpanAnggota").textContent = "Update Anggota";
    document.getElementById("tombolBatalAnggota").hidden = false;

    document.getElementById("formAnggota").scrollIntoView({ behavior: "smooth" });
  } catch (err) {
    console.error("editAnggota:", err);
  }
}

function resetFormAnggota() {
  const form = document.getElementById("formAnggota");
  if (form) form.reset();
  document.getElementById("idAnggota").value = "";
  document.getElementById("statusAnggota").value = "aktif";
  document.getElementById("dialihkanKeId").value = "";
  document.getElementById("pengalihanMulai").value = "";
  document.getElementById("pengalihanSelesai").value = "";
  document.getElementById("catatanPengalihan").value = "";
  toggleFormPengalihanAnggota();

  document.getElementById("judulFormAnggota").textContent = "Tambah Data Anggota";
  document.getElementById("tombolSimpanAnggota").textContent = "Simpan Anggota";
  document.getElementById("tombolBatalAnggota").hidden = true;
}

document.getElementById("formAnggota").addEventListener("submit", async event => {
  event.preventDefault();

  const id = document.getElementById("idAnggota").value;
  const payload = {
    nomor_anggota: document.getElementById("nomorAnggota").value,
    nama: document.getElementById("namaAnggota").value,
    telepon: document.getElementById("teleponAnggota").value,
    status: document.getElementById("statusAnggota").value,
    dialihkan_ke_id: document.getElementById("dialihkanKeId")?.value || null,
    pengalihan_mulai: document.getElementById("pengalihanMulai")?.value || null,
    pengalihan_selesai: document.getElementById("pengalihanSelesai")?.value || null,
    catatan_pengalihan: document.getElementById("catatanPengalihan")?.value || null
  };

  try {
    const res = await fetch(
      id ? `${API_ANGGOTA}/${id}` : API_ANGGOTA,
      {
        method: id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      }
    );

    const hasil = await res.json();
    if (!res.ok) {
      alert(hasil.pesan || "Gagal menyimpan anggota");
      return;
    }

    alert(hasil.pesan || "Data anggota berhasil disimpan");
    resetFormAnggota();
    await tampilkanAnggota();
  } catch (err) {
    console.error("submit formAnggota:", err);
    alert("Terjadi kesalahan saat menyimpan anggota");
  }
});

document.getElementById("tombolBatalAnggota").addEventListener("click", resetFormAnggota);

async function hapusAnggota(id) {
  if (!confirm("Hapus anggota ini? Catatan transaksi terkait akan tetap ada.")) return;

  try {
    const res = await fetch(`${API_ANGGOTA}/${id}`, { method: "DELETE" });
    const hasil = await res.json();

    if (!res.ok) {
      alert(hasil.pesan || "Gagal menghapus anggota");
      return;
    }

    alert(hasil.pesan || "Anggota berhasil dihapus");
    await tampilkanAnggota();
  } catch (err) {
    console.error("hapusAnggota:", err);
    alert("Terjadi kesalahan saat menghapus anggota");
  }
}

// ============================================================
// 8. CRUD MASTER POS PENGELUARAN
// ============================================================

async function tampilkanPos() {
  try {
    const res = await fetch(API_POS);
    if (!res.ok) throw new Error("Gagal mengambil pos pengeluaran");

    dataPosList = await res.json();
    const tabel = document.getElementById("daftarPos");
    if (!tabel) return;
    tabel.innerHTML = "";

    dataPosList.forEach(p => {
      const baris = document.createElement("tr");

      const kolom = [
        { label: "Nama Pos", nilai: p.nama_pos },
        { label: "Deskripsi", nilai: p.deskripsi || "-" },
        { label: "Dibuat", nilai: formatWaktu(p.created_at) }
      ];

      kolom.forEach(k => {
        const td = document.createElement("td");
        td.setAttribute("data-label", k.label);
        td.textContent = k.nilai;
        baris.appendChild(td);
      });

      const aksi = document.createElement("td");
      aksi.setAttribute("data-label", "Aksi");

      const wrapper = document.createElement("div");
      wrapper.className = "aksi-wrapper";

      const btnEdit = document.createElement("button");
      btnEdit.textContent = "Edit";
      btnEdit.className = "btn btn-xs btn-soft-primary";
      btnEdit.onclick = () => editPos(p.id);

      const btnHapus = document.createElement("button");
      btnHapus.textContent = "Hapus";
      btnHapus.className = "btn btn-xs btn-soft-danger";
      btnHapus.onclick = () => hapusPos(p.id);

      wrapper.appendChild(btnEdit);
      wrapper.appendChild(btnHapus);
      aksi.appendChild(wrapper);

      baris.appendChild(aksi);
      tabel.appendChild(baris);
    });

    await muatDropdownPos();
  } catch (err) {
    console.error("tampilkanPos:", err);
  }
}

async function editPos(id) {
  try {
    const res = await fetch(`${API_POS}/${id}`);
    const data = await res.json();

    if (!res.ok) {
      alert(data.pesan || "Pos tidak ditemukan");
      return;
    }

    document.getElementById("idPos").value = data.id;
    document.getElementById("namaPos").value = data.nama_pos;
    document.getElementById("deskripsiPos").value = data.deskripsi || "";

    document.getElementById("judulFormPos").textContent = "Edit Pos Pengeluaran";
    document.getElementById("tombolSimpanPos").textContent = "Update Pos";
    document.getElementById("tombolBatalPos").hidden = false;

    document.getElementById("formPos").scrollIntoView({ behavior: "smooth" });
  } catch (err) {
    console.error("editPos:", err);
  }
}

function resetFormPos() {
  const form = document.getElementById("formPos");
  if (form) form.reset();
  document.getElementById("idPos").value = "";
  document.getElementById("judulFormPos").textContent = "Tambah Pos Pengeluaran";
  document.getElementById("tombolSimpanPos").textContent = "Simpan Pos";
  document.getElementById("tombolBatalPos").hidden = true;
}

document.getElementById("formPos").addEventListener("submit", async event => {
  event.preventDefault();

  const id = document.getElementById("idPos").value;
  const payload = {
    nama_pos: document.getElementById("namaPos").value,
    deskripsi: document.getElementById("deskripsiPos").value
  };

  try {
    const res = await fetch(
      id ? `${API_POS}/${id}` : API_POS,
      {
        method: id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      }
    );

    const hasil = await res.json();
    if (!res.ok) {
      alert(hasil.pesan || "Gagal menyimpan pos pengeluaran");
      return;
    }

    alert(hasil.pesan || "Pos pengeluaran berhasil disimpan");
    resetFormPos();
    await tampilkanPos();
  } catch (err) {
    console.error("submit formPos:", err);
    alert("Terjadi kesalahan saat menyimpan pos");
  }
});

document.getElementById("tombolBatalPos").addEventListener("click", resetFormPos);

async function hapusPos(id) {
  if (!confirm("Hapus pos pengeluaran ini? Catatan transaksi terkait akan tetap ada.")) return;

  try {
    const res = await fetch(`${API_POS}/${id}`, { method: "DELETE" });
    const hasil = await res.json();

    if (!res.ok) {
      alert(hasil.pesan || "Gagal menghapus pos pengeluaran");
      return;
    }

    alert(hasil.pesan || "Pos pengeluaran berhasil dihapus");
    await tampilkanPos();
  } catch (err) {
    console.error("hapusPos:", err);
    alert("Terjadi kesalahan saat menghapus pos");
  }
}

// ============================================================
// 9. MODAL & CETAK / GENERATE LAPORAN KAS RESMI (PDF)
// ============================================================

function bukaModalLaporanPdf() {
  const modal = document.getElementById("modalLaporanPdf");
  if (!modal) return;
  modal.classList.add("open");
  renderLaporanPdf();
}

function tutupModalLaporanPdf() {
  const modal = document.getElementById("modalLaporanPdf");
  if (!modal) return;
  modal.classList.remove("open");
}

// Tutup modal jika tombol Escape ditekan atau area backdrop diklik
document.addEventListener("keydown", e => {
  if (e.key === "Escape") {
    tutupModalLaporanPdf();
  }
});

const modalLaporanEl = document.getElementById("modalLaporanPdf");
if (modalLaporanEl) {
  modalLaporanEl.addEventListener("click", e => {
    if (e.target === modalLaporanEl) {
      tutupModalLaporanPdf();
    }
  });
}

function renderLaporanPdf() {
  const container = document.getElementById("printableReport");
  if (!container) return;

  const periodeSelect = document.getElementById("pilihPeriodeLaporanPdf");
  const modePeriode = periodeSelect ? periodeSelect.value : "bulan_ini";

  const filterBulanEl = document.getElementById("filterBulan");
  const bulanFilter = filterBulanEl && filterBulanEl.value ? filterBulanEl.value : "";

  // Filter data sesuai opsi
  let filtered = [...dataTransaksiList];
  let judulPeriode = "Semua Riwayat Transaksi";
  let saldoAwal = 0;

  if (modePeriode === "bulan_ini" && bulanFilter) {
    const [tahun, bulan] = bulanFilter.split("-");
    const namaBln = namaBulanIndo[parseInt(bulan, 10) - 1] || bulan;
    judulPeriode = `Bulan ${namaBln} ${tahun}`;

    // Hitung saldo awal (transaksi sebelum bulan berjalan)
    dataTransaksiList.forEach(t => {
      const tBulan = t.tanggal ? t.tanggal.slice(0, 7) : "";
      if (tBulan < bulanFilter) {
        if (t.jenis === "masuk") saldoAwal += Number(t.jumlah) || 0;
        else saldoAwal -= Number(t.jumlah) || 0;
      }
    });

    filtered = dataTransaksiList.filter(t => t.tanggal && t.tanggal.startsWith(bulanFilter));
  }

  // Urutkan transaksi secara kronologis (tanggal terlama ke terbaru) untuk running balance
  filtered.sort((a, b) => {
    if (a.tanggal !== b.tanggal) return a.tanggal.localeCompare(b.tanggal);
    return Number(a.id) - Number(b.id);
  });

  let totalMasuk = 0;
  let totalKeluar = 0;
  let runningSaldo = saldoAwal;

  const rowListHtml = filtered.map((t, idx) => {
    const isMasuk = t.jenis === "masuk";
    const nominal = Number(t.jumlah) || 0;
    if (isMasuk) {
      totalMasuk += nominal;
      runningSaldo += nominal;
    } else {
      totalKeluar += nominal;
      runningSaldo -= nominal;
    }

    const pihak = isMasuk
      ? (t.nama_anggota ? `${t.nama_anggota}` : (t.subjek || "-"))
      : (t.nama_pos_pengeluaran ? `${t.nama_pos_pengeluaran}` : (t.subjek || "-"));

    return `
      <tr>
        <td class="td-center">${idx + 1}</td>
        <td class="td-center">${t.tanggal || "-"}</td>
        <td class="td-center td-ref">#TRX-${t.id}</td>
        <td class="td-pihak">${pihak}</td>
        <td class="td-ket">${t.keterangan || "-"}</td>
        <td class="td-right td-income">${isMasuk ? formatRupiah(nominal) : "-"}</td>
        <td class="td-right td-expense">${!isMasuk ? formatRupiah(nominal) : "-"}</td>
        <td class="td-right td-balance">${formatRupiah(runningSaldo)}</td>
      </tr>
    `;
  }).join("");

  const netCashFlow = totalMasuk - totalKeluar;
  const saldoAkhir = runningSaldo;

  const todayStr = new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(new Date());

  const noDokumen = `LK/${new Date().getFullYear()}/${String(new Date().getMonth() + 1).padStart(2, "0")}/${Date.now().toString().slice(-4)}`;

  container.innerHTML = `
    <!-- Kop Surat Dokumen Bersih & Minimalis -->
    <header class="rep-header">
      <div class="rep-brand">
        <h2 class="rep-org-name">KAS ORGANISASI MANDIRI</h2>
        <p class="rep-org-desc">Laporan Pertanggungjawaban Keuangan & Rekapitulasi Kas Internal</p>
      </div>
      <div class="rep-doc-meta">
        <div class="meta-item"><span>No. Dok:</span> ${noDokumen}</div>
        <div class="meta-item"><span>Tanggal Cetak:</span> ${todayStr}</div>
      </div>
    </header>

    <!-- Judul Dokumen & Periode -->
    <div class="rep-title-block">
      <h1>LAPORAN ARUS KAS MASUK & KELUAR</h1>
      <div class="rep-period-subtitle">Periode: ${judulPeriode}</div>
    </div>

    <!-- Ringkasan Finansial Ringkas & Ringan (Bukan Card Dashboard) -->
    <div class="rep-summary-bar">
      <div class="summary-col">
        <span class="sum-label">Saldo Awal</span>
        <span class="sum-val">${formatRupiah(saldoAwal)}</span>
      </div>
      <div class="summary-divider"></div>
      <div class="summary-col">
        <span class="sum-label">Total Pemasukan</span>
        <span class="sum-val val-in">${formatRupiah(totalMasuk)}</span>
      </div>
      <div class="summary-divider"></div>
      <div class="summary-col">
        <span class="sum-label">Total Pengeluaran</span>
        <span class="sum-val val-out">${formatRupiah(totalKeluar)}</span>
      </div>
      <div class="summary-divider"></div>
      <div class="summary-col">
        <span class="sum-label">Surplus / (Defisit)</span>
        <span class="sum-val val-net" style="color: ${netCashFlow >= 0 ? '#2563eb' : '#dc2626'};">
          ${netCashFlow >= 0 ? "+" : ""}${formatRupiah(netCashFlow)}
        </span>
      </div>
      <div class="summary-divider"></div>
      <div class="summary-col">
        <span class="sum-label">Saldo Akhir Buku</span>
        <span class="sum-val val-balance">${formatRupiah(saldoAkhir)}</span>
      </div>
    </div>

    <!-- Tabel Buku Kas Umum (Light & Clean Ledger) -->
    <div class="rep-table-wrap">
      <div class="rep-section-heading">Buku Kas Umum (General Ledger)</div>
      <table class="rep-table">
        <thead>
          <tr>
            <th class="th-num">No</th>
            <th class="th-date">Tanggal</th>
            <th class="th-ref">No. Ref</th>
            <th>Pihak / Subjek / Pos</th>
            <th>Keterangan</th>
            <th class="th-right" style="width: 110px;">Pemasukan (D)</th>
            <th class="th-right" style="width: 110px;">Pengeluaran (K)</th>
            <th class="th-right" style="width: 115px;">Saldo Kas</th>
          </tr>
        </thead>
        <tbody>
          ${saldoAwal !== 0 ? `
            <tr class="row-saldo-awal">
              <td class="td-center">-</td>
              <td class="td-center">-</td>
              <td class="td-center td-ref">AWAL</td>
              <td colspan="4"><span class="fw-semibold">Saldo Awal Periode Sebelumnya</span></td>
              <td class="td-right td-balance">${formatRupiah(saldoAwal)}</td>
            </tr>
          ` : ""}
          ${rowListHtml.length > 0 ? rowListHtml : `
            <tr>
              <td colspan="8" style="text-align: center; padding: 2rem; color: #94a3b8; font-weight: 300;">
                Tidak ada data transaksi pada periode yang dipilih.
              </td>
            </tr>
          `}
        </tbody>
        <tfoot>
          <tr>
            <td colspan="5" style="text-align: right;" class="fw-semibold">TOTAL MUTASI KAS PERIODE INI:</td>
            <td class="td-right td-income">${formatRupiah(totalMasuk)}</td>
            <td class="td-right td-expense">${formatRupiah(totalKeluar)}</td>
            <td class="td-right td-balance">${formatRupiah(saldoAkhir)}</td>
          </tr>
        </tfoot>
      </table>
    </div>

    <!-- Lembar Pengesahan / Tanda Tangan (Format Rapi Tanpa Wrapping) -->
    <div class="rep-signatures">
      <div class="sig-location-date">
        Disahkan pada: ${todayStr}
      </div>
      <div class="sig-row">
        <div class="sig-box">
          <div class="sig-role">Mengetahui,<span>Ketua Organisasi</span></div>
          <div class="sig-space"></div>
          <div class="sig-name">( &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; )</div>
          <div class="sig-id">NIP / ID: KET-001</div>
        </div>
        <div class="sig-box">
          <div class="sig-role">Dibuat & Diverifikasi,<span>Bendahara Umum</span></div>
          <div class="sig-space"></div>
          <div class="sig-name">( &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; )</div>
          <div class="sig-id">NIP / ID: BND-001</div>
        </div>
      </div>
    </div>

    <!-- Footer Lembar Dokumen -->
    <footer class="rep-doc-footer">
      <div>Dokumen ini diterbitkan secara digital melalui Sistem Aplikasi Kas Organisasi.</div>
      <div>Halaman 1 dari 1</div>
    </footer>
  `;
}

function cetakLaporanPdf() {
  window.print();
}

// ============================================================
// 10. EXPORT DATA KAS CADANGAN (CSV)
// ============================================================

function eksporLaporanKas() {
  if (dataTransaksiList.length === 0) {
    alert("Tidak ada transaksi untuk diekspor");
    return;
  }

  const headers = ["ID", "Tanggal", "Jenis", "Subjek", "Pihak/Pos", "Keterangan", "Jumlah (IDR)", "Dibuat Pada"];
  const rows = dataTransaksiList.map(t => {
    const pihak = t.jenis === "masuk" ? (t.nama_anggota || "-") : (t.nama_pos_pengeluaran || "-");
    return [
      t.id,
      t.tanggal,
      t.jenis,
      `"${(t.subjek || "").replace(/"/g, '""')}"`,
      `"${pihak.replace(/"/g, '""')}"`,
      `"${(t.keterangan || "").replace(/"/g, '""')}"`,
      t.jumlah,
      t.created_at || ""
    ];
  });

  const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `Rekap_Kas_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// ============================================================
// 11. MANAJEMEN EVENT & BUDGET
// ============================================================

async function muatDropdownEvent() {
  try {
    const res = await fetch(API_EVENT);
    if (!res.ok) return;
    dataEventList = await res.json();

    const select = document.getElementById("transaksiEventId");
    if (!select) return;
    const currentVal = select.value;
    select.innerHTML = '<option value="">-- Tanpa Event (Umum) --</option>';

    dataEventList.forEach(e => {
      const opt = document.createElement("option");
      opt.value = e.id;
      opt.textContent = `${e.nama_event} (${e.status})`;
      if (String(e.id) === String(currentVal)) opt.selected = true;
      select.appendChild(opt);
    });
  } catch (err) {
    console.error("muatDropdownEvent:", err);
  }
}

async function tampilkanEvent() {
  try {
    const res = await fetch(API_EVENT);
    if (!res.ok) throw new Error("Gagal mengambil data event");
    dataEventList = await res.json();

    const tabel = document.getElementById("daftarEvent");
    if (!tabel) return;
    tabel.innerHTML = "";

    if (dataEventList.length === 0) {
      tabel.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:2rem;color:#94a3b8;">Belum ada program event yang dibuat.</td></tr>';
      return;
    }

    dataEventList.forEach(e => {
      const tr = document.createElement("tr");

      const anggaran = Number(e.anggaran) || 0;
      const pengeluaran = Number(e.total_pengeluaran) || 0;
      const sisa = Number(e.sisa_anggaran) || (anggaran - pengeluaran);
      const pct = anggaran > 0 ? Math.round((pengeluaran / anggaran) * 100) : 0;

      let pctClass = "safe";
      if (pct > 100) pctClass = "danger";
      else if (pct >= 75) pctClass = "warning";

      const tglMulai = e.tanggal_mulai || "-";
      const tglSelesai = e.tanggal_selesai || "-";
      const periodeInfo = e.nama_periode ? `<strong>${e.nama_periode}</strong><br>` : "";

      const kolom = [
        { label: "Nama Event", nilai: `<strong>${e.nama_event}</strong>${e.deskripsi ? `<br><small style="color:#64748b;">${e.deskripsi}</small>` : ""}`, isHtml: true },
        { label: "Periode / Durasi", nilai: `${periodeInfo}<small>${tglMulai} s/d ${tglSelesai}</small>`, isHtml: true },
        { label: "Alokasi Budget", nilai: formatRupiah(anggaran) },
        { label: "Realisasi Belanja", nilai: `<span style="color:#dc2626;font-weight:600;">${formatRupiah(pengeluaran)}</span>`, isHtml: true },
        { label: "Sisa Anggaran", nilai: `<span style="color:${sisa >= 0 ? '#059669' : '#dc2626'};font-weight:600;">${formatRupiah(sisa)}</span>`, isHtml: true },
        { 
          label: "Penyerapan", 
          nilai: `
            <div class="budget-progress-box">
              <div class="budget-progress-header">
                <span>Terpakai</span>
                <span>${pct}%</span>
              </div>
              <div class="budget-track">
                <div class="budget-fill ${pctClass}" style="width: ${Math.min(pct, 100)}%;"></div>
              </div>
            </div>
          `,
          isHtml: true 
        },
        { label: "Status", nilai: `<span class="badge-status status-${e.status}">${e.status.toUpperCase()}</span>`, isHtml: true }
      ];

      kolom.forEach(k => {
        const td = document.createElement("td");
        td.setAttribute("data-label", k.label);
        if (k.isHtml) td.innerHTML = k.nilai;
        else td.textContent = k.nilai;
        tr.appendChild(td);
      });

      const aksi = document.createElement("td");
      aksi.setAttribute("data-label", "Aksi");
      const wrapper = document.createElement("div");
      wrapper.className = "aksi-wrapper";

      const btnEdit = document.createElement("button");
      btnEdit.textContent = "Edit";
      btnEdit.className = "btn btn-xs btn-soft-primary";
      btnEdit.onclick = () => editEvent(e.id);

      const btnHapus = document.createElement("button");
      btnHapus.textContent = "Hapus";
      btnHapus.className = "btn btn-xs btn-soft-danger";
      btnHapus.onclick = () => hapusEvent(e.id);

      wrapper.appendChild(btnEdit);
      wrapper.appendChild(btnHapus);
      aksi.appendChild(wrapper);
      tr.appendChild(aksi);

      tabel.appendChild(tr);
    });

    await muatDropdownEvent();
  } catch (err) {
    console.error("tampilkanEvent:", err);
  }
}

async function editEvent(id) {
  try {
    const res = await fetch(`${API_EVENT}/${id}`);
    const data = await res.json();
    if (!res.ok) return alert(data.pesan || "Event tidak ditemukan");

    document.getElementById("idEvent").value = data.id;
    document.getElementById("namaEvent").value = data.nama_event;
    document.getElementById("anggaranEvent").value = data.anggaran;
    document.getElementById("periodeIdEvent").value = data.periode_id || "";
    document.getElementById("statusEvent").value = data.status || "berjalan";
    document.getElementById("tanggalMulaiEvent").value = data.tanggal_mulai || "";
    document.getElementById("tanggalSelesaiEvent").value = data.tanggal_selesai || "";
    document.getElementById("deskripsiEvent").value = data.deskripsi || "";

    document.getElementById("judulFormEvent").textContent = "Edit Event & Anggaran";
    document.getElementById("tombolSimpanEvent").textContent = "Update Event";
    document.getElementById("tombolBatalEvent").hidden = false;

    document.getElementById("formEvent").scrollIntoView({ behavior: "smooth" });
  } catch (err) {
    console.error("editEvent:", err);
  }
}

function resetFormEvent() {
  const form = document.getElementById("formEvent");
  if (form) form.reset();
  document.getElementById("idEvent").value = "";
  document.getElementById("judulFormEvent").textContent = "Tambah Event & Anggaran";
  document.getElementById("tombolSimpanEvent").textContent = "Simpan Event";
  document.getElementById("tombolBatalEvent").hidden = true;
}

const formEventEl = document.getElementById("formEvent");
if (formEventEl) {
  formEventEl.addEventListener("submit", async event => {
    event.preventDefault();
    const id = document.getElementById("idEvent").value;
    const payload = {
      nama_event: document.getElementById("namaEvent").value,
      anggaran: document.getElementById("anggaranEvent").value,
      periode_id: document.getElementById("periodeIdEvent").value || null,
      status: document.getElementById("statusEvent").value,
      tanggal_mulai: document.getElementById("tanggalMulaiEvent").value || null,
      tanggal_selesai: document.getElementById("tanggalSelesaiEvent").value || null,
      deskripsi: document.getElementById("deskripsiEvent").value
    };

    try {
      const res = await fetch(id ? `${API_EVENT}/${id}` : API_EVENT, {
        method: id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const hasil = await res.json();
      if (!res.ok) return alert(hasil.pesan || "Gagal menyimpan event");

      alert(hasil.pesan || "Event berhasil disimpan");
      resetFormEvent();
      await tampilkanEvent();
    } catch (err) {
      console.error("submit formEvent:", err);
      alert("Terjadi kesalahan saat menyimpan event");
    }
  });

  document.getElementById("tombolBatalEvent")?.addEventListener("click", resetFormEvent);
}

async function hapusEvent(id) {
  if (!confirm("Hapus event ini? Transaksi kas terkait akan tetap ada.")) return;
  try {
    const res = await fetch(`${API_EVENT}/${id}`, { method: "DELETE" });
    const hasil = await res.json();
    if (!res.ok) return alert(hasil.pesan || "Gagal menghapus event");
    alert(hasil.pesan || "Event berhasil dihapus");
    await tampilkanEvent();
  } catch (err) {
    console.error("hapusEvent:", err);
    alert("Terjadi kesalahan saat menghapus event");
  }
}

// ============================================================
// 12. PENGATURAN PERIODE KEUANGAN & TARIF IURAN
// ============================================================

async function muatDropdownPeriode() {
  try {
    const res = await fetch(API_PERIODE);
    if (!res.ok) return;
    dataPeriodeList = await res.json();

    const select = document.getElementById("periodeIdEvent");
    if (!select) return;
    const currentVal = select.value;
    select.innerHTML = '<option value="">-- Pilih Periode Keuangan --</option>';

    dataPeriodeList.forEach(p => {
      const opt = document.createElement("option");
      opt.value = p.id;
      opt.textContent = `${p.nama_periode} (${p.tanggal_mulai} s/d ${p.tanggal_selesai})${p.is_aktif ? ' [Aktif]' : ''}`;
      if (String(p.id) === String(currentVal) || (!currentVal && p.is_aktif)) opt.selected = true;
      select.appendChild(opt);
    });
  } catch (err) {
    console.error("muatDropdownPeriode:", err);
  }
}

async function tampilkanPeriode() {
  try {
    const res = await fetch(API_PERIODE);
    if (!res.ok) throw new Error("Gagal mengambil data periode");
    dataPeriodeList = await res.json();

    const tabel = document.getElementById("daftarPeriode");
    if (!tabel) return;
    tabel.innerHTML = "";

    dataPeriodeList.forEach(p => {
      const tr = document.createElement("tr");

      const statusBadge = p.is_aktif
        ? '<span class="badge-status periode-aktif">● Sedang Aktif</span>'
        : '<span class="badge-status nonaktif">Arsip / Nonaktif</span>';

      const kolom = [
        { label: "Nama Periode", nilai: `<strong>${p.nama_periode}</strong>`, isHtml: true },
        { label: "Rentang Waktu", nilai: `${p.tanggal_mulai} s/d ${p.tanggal_selesai}` },
        { label: "Status", nilai: statusBadge, isHtml: true },
        { label: "Keterangan", nilai: p.keterangan || "-" }
      ];

      kolom.forEach(k => {
        const td = document.createElement("td");
        td.setAttribute("data-label", k.label);
        if (k.isHtml) td.innerHTML = k.nilai;
        else td.textContent = k.nilai;
        tr.appendChild(td);
      });

      const aksi = document.createElement("td");
      aksi.setAttribute("data-label", "Aksi");
      const wrapper = document.createElement("div");
      wrapper.className = "aksi-wrapper";

      if (!p.is_aktif) {
        const btnAktif = document.createElement("button");
        btnAktif.textContent = "Jadikan Aktif";
        btnAktif.className = "btn btn-xs btn-soft-success";
        btnAktif.onclick = () => setPeriodeAktif(p.id);
        wrapper.appendChild(btnAktif);
      }

      const btnEdit = document.createElement("button");
      btnEdit.textContent = "Edit";
      btnEdit.className = "btn btn-xs btn-soft-primary";
      btnEdit.onclick = () => editPeriode(p.id);

      const btnHapus = document.createElement("button");
      btnHapus.textContent = "Hapus";
      btnHapus.className = "btn btn-xs btn-soft-danger";
      btnHapus.onclick = () => hapusPeriode(p.id);

      wrapper.appendChild(btnEdit);
      wrapper.appendChild(btnHapus);
      aksi.appendChild(wrapper);
      tr.appendChild(aksi);

      tabel.appendChild(tr);
    });

    await muatDropdownPeriode();
  } catch (err) {
    console.error("tampilkanPeriode:", err);
  }
}

async function setPeriodeAktif(id) {
  try {
    const res = await fetch(`${API_PERIODE}/${id}/aktif`, { method: "PATCH" });
    const data = await res.json();
    if (!res.ok) return alert(data.pesan || "Gagal mengubah periode aktif");
    alert("Periode aktif berhasil diubah");
    await tampilkanPeriode();
  } catch (err) {
    console.error("setPeriodeAktif:", err);
  }
}

async function editPeriode(id) {
  try {
    const res = await fetch(`${API_PERIODE}/${id}`);
    const data = await res.json();
    if (!res.ok) return alert(data.pesan || "Periode tidak ditemukan");

    document.getElementById("idPeriode").value = data.id;
    document.getElementById("namaPeriode").value = data.nama_periode;
    document.getElementById("tanggalMulaiPeriode").value = data.tanggal_mulai;
    document.getElementById("tanggalSelesaiPeriode").value = data.tanggal_selesai;
    document.getElementById("isAktifPeriode").checked = Boolean(data.is_aktif);
    document.getElementById("keteranganPeriode").value = data.keterangan || "";

    document.getElementById("judulFormPeriode").textContent = "Edit Periode Keuangan";
    document.getElementById("tombolSimpanPeriode").textContent = "Update Periode";
    document.getElementById("tombolBatalPeriode").hidden = false;

    document.getElementById("formPeriode").scrollIntoView({ behavior: "smooth" });
  } catch (err) {
    console.error("editPeriode:", err);
  }
}

function resetFormPeriode() {
  const form = document.getElementById("formPeriode");
  if (form) form.reset();
  document.getElementById("idPeriode").value = "";
  document.getElementById("judulFormPeriode").textContent = "Tetapkan Periode Keuangan & Durasi";
  document.getElementById("tombolSimpanPeriode").textContent = "Simpan Periode";
  document.getElementById("tombolBatalPeriode").hidden = true;
}

const formPeriodeEl = document.getElementById("formPeriode");
if (formPeriodeEl) {
  formPeriodeEl.addEventListener("submit", async event => {
    event.preventDefault();
    const id = document.getElementById("idPeriode").value;
    const payload = {
      nama_periode: document.getElementById("namaPeriode").value,
      tanggal_mulai: document.getElementById("tanggalMulaiPeriode").value,
      tanggal_selesai: document.getElementById("tanggalSelesaiPeriode").value,
      is_aktif: document.getElementById("isAktifPeriode").checked ? 1 : 0,
      keterangan: document.getElementById("keteranganPeriode").value
    };

    try {
      const res = await fetch(id ? `${API_PERIODE}/${id}` : API_PERIODE, {
        method: id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const hasil = await res.json();
      if (!res.ok) return alert(hasil.pesan || "Gagal menyimpan periode");

      alert(hasil.pesan || "Periode keuangan berhasil disimpan");
      resetFormPeriode();
      await tampilkanPeriode();
    } catch (err) {
      console.error("submit formPeriode:", err);
      alert("Terjadi kesalahan saat menyimpan periode");
    }
  });

  document.getElementById("tombolBatalPeriode")?.addEventListener("click", resetFormPeriode);
}

async function hapusPeriode(id) {
  if (!confirm("Hapus periode keuangan ini?")) return;
  try {
    const res = await fetch(`${API_PERIODE}/${id}`, { method: "DELETE" });
    const hasil = await res.json();
    if (!res.ok) return alert(hasil.pesan || "Gagal menghapus periode");
    alert(hasil.pesan || "Periode berhasil dihapus");
    await tampilkanPeriode();
  } catch (err) {
    console.error("hapusPeriode:", err);
    alert("Terjadi kesalahan saat menghapus periode");
  }
}

// Manajemen Tarif Iuran
async function muatTarifIuran() {
  try {
    const res = await fetch(API_TARIF);
    if (!res.ok) return;
    dataTarifList = await res.json();

    dataTarifList.forEach(t => {
      if (t.status_anggota === "aktif") {
        const inp = document.getElementById("tarifAktif");
        if (inp) inp.value = t.nominal;
        const desc = document.getElementById("descTarifAktif");
        if (desc) desc.value = t.keterangan || "";
      } else if (t.status_anggota === "tidak_aktif") {
        const inp = document.getElementById("tarifTidakAktif");
        if (inp) inp.value = t.nominal;
        const desc = document.getElementById("descTarifTidakAktif");
        if (desc) desc.value = t.keterangan || "";
      } else if (t.status_anggota === "dialihkan") {
        const inp = document.getElementById("tarifDialihkan");
        if (inp) inp.value = t.nominal;
        const desc = document.getElementById("descTarifDialihkan");
        if (desc) desc.value = t.keterangan || "";
      }
    });
  } catch (err) {
    console.error("muatTarifIuran:", err);
  }
}

const formTarifEl = document.getElementById("formTarifIuran");
if (formTarifEl) {
  formTarifEl.addEventListener("submit", async event => {
    event.preventDefault();

    const tAktif = {
      nominal: document.getElementById("tarifAktif").value,
      keterangan: document.getElementById("descTarifAktif").value
    };
    const tTidakAktif = {
      nominal: document.getElementById("tarifTidakAktif").value,
      keterangan: document.getElementById("descTarifTidakAktif").value
    };
    const tDialihkan = {
      nominal: document.getElementById("tarifDialihkan").value,
      keterangan: document.getElementById("descTarifDialihkan").value
    };

    try {
      await Promise.all([
        fetch(`${API_TARIF}/aktif`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(tAktif)
        }),
        fetch(`${API_TARIF}/tidak_aktif`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(tTidakAktif)
        }),
        fetch(`${API_TARIF}/dialihkan`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(tDialihkan)
        })
      ]);

      alert("Semua tarif iuran berhasil diperbarui");
      await muatTarifIuran();
    } catch (err) {
      console.error("submit formTarifIuran:", err);
      alert("Terjadi kesalahan saat menyimpan tarif iuran");
    }
  });
}

// ============================================================
// 13. INISIALISASI APLIKASI
// ============================================================

const inputFilterBulan = document.getElementById("filterBulan");
if (inputFilterBulan) {
  inputFilterBulan.addEventListener("change", () => {
    renderDashboardOverview();
  });
}

async function initApp() {
  inisialisasiNavigation();
  inisialisasiFormDinamis();
  inisialisasiFilterBulan();

  await Promise.all([
    muatDropdownAnggota(),
    muatDropdownPos(),
    muatTarifIuran(),
    muatDropdownEvent()
  ]);

  await tampilkanTransaksi();
}

initApp();

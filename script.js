// ============================================
// KONFIGURASI API
// ============================================
const API = "https://backend-kelas-production.up.railway.app";

// ============================================
// STATE
// ============================================
let CURRENT_USER = null;
let DATA = {
  info: {},
  schedules: [],
  cleanings: [],
  announcements: [],
  events: [],
  users: [],
  admins: [],
  structure: [],
};

const $ = (id) => document.getElementById(id);

// ============================================
// DETEKSI HALAMAN
// ============================================
const IS_LOGIN_PAGE = document.querySelector(".auth-wrapper") !== null;

// ============================================
// ========== LOGIN PAGE ==========
// ============================================
if (IS_LOGIN_PAGE) {
  initLoginPage();
}

async function initLoginPage() {
  try {
    const res = await fetch(API + "/api/auth/me", { credentials: "include" });
    if (res.ok) {
      const d = await res.json();
      if (d.user.role === "admin" || d.user.role === "developer") {
        window.location.href = "admin.html";
      }
    }
  } catch {}
}

function showMsg(text, type) {
  const el = $("message");
  if (!el) return;
  el.textContent = text;
  el.className = "msg " + type;
}

// ============================================
// LOGIN
// ============================================
async function handleLogin() {
  const email = $("email").value.trim();
  const password = $("password").value;

  if (!email || !password) return showMsg("Email & password wajib diisi", "error");

  showMsg("Memproses...", "");

  try {
    const res = await fetch(API + "/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    if (!res.ok) return showMsg(data.message, "error");

    showMsg("Login berhasil!", "success");
    setTimeout(() => (window.location.href = "admin.html"), 700);
  } catch (err) {
    console.error(err);
    showMsg("Gagal konek server", "error");
  }
}

// ============================================
// ========== ADMIN PANEL ==========
// ============================================
if (!IS_LOGIN_PAGE) {
  initAdminPanel();
}

async function initAdminPanel() {
  try {
    const res = await fetch(API + "/api/auth/me", { credentials: "include" });

    if (!res.ok) {
      window.location.href = "index.html";
      return;
    }

    const data = await res.json();
    if (data.user.role !== "admin" && data.user.role !== "developer") {
      window.location.href = "index.html";
      return;
    }

    CURRENT_USER = data.user;
    $("user-info").textContent = `👋 ${CURRENT_USER.name}`;

    const badge = $("role-badge");
    if (CURRENT_USER.role === "developer") {
      badge.textContent = "DEVELOPER";
      badge.style.background = "rgba(0,255,157,0.1)";
      badge.style.color = "#00ff9d";
      badge.style.borderColor = "rgba(0,255,157,0.3)";
      $("tab-akun").classList.remove("hidden");
    } else {
      badge.textContent = "ADMIN";
    }

    await loadAllData();
    renderTab("info");
  } catch (err) {
    console.error(err);
    window.location.href = "index.html";
  }
}

function logout() {
  if (!confirm("Yakin mau logout?")) return;
  fetch(API + "/api/auth/logout", { method: "POST", credentials: "include" })
    .finally(() => (window.location.href = "index.html"));
}

// ============================================
// LOAD DATA
// ============================================
async function loadAllData() {
  const fetchJSON = async (url) => {
    const res = await fetch(API + url, { credentials: "include" });
    if (!res.ok) throw new Error("Gagal fetch " + url);
    return res.json();
  };

  const [info, schedules, cleanings, announcements, events, users, structure] =
    await Promise.all([
      fetchJSON("/api/class-info"),
      fetchJSON("/api/schedule"),
      fetchJSON("/api/cleaning"),
      fetchJSON("/api/announcement"),
      fetchJSON("/api/event"),
      fetchJSON("/api/auth/users"),
      fetchJSON("/api/structure"),
    ]);

  DATA = {
    info: info.info || {},
    schedules: schedules.schedules || [],
    cleanings: cleanings.cleanings || [],
    announcements: announcements.announcements || [],
    events: events.events || [],
    users: users.users || [],
    structure: structure.structure || [],
    admins: DATA.admins || [],
  };
}

async function loadAdmins() {
  try {
    const res = await fetch(API + "/api/auth/admins", { credentials: "include" });
    if (!res.ok) return;
    const data = await res.json();
    DATA.admins = data.admins || [];
  } catch (err) {
    console.error(err);
  }
}

// ============================================
// TABS
// ============================================
function switchTab(tab, btn) {
  document.querySelectorAll(".tab").forEach((t) => t.classList.remove("active"));
  if (btn) btn.classList.add("active");

  if (tab === "akun") {
    loadAdmins().then(() => renderTab(tab));
    return;
  }
  renderTab(tab);
}

function renderTab(tab) {
  const c = $("content");
  if (tab === "info") c.innerHTML = renderInfo();
  else if (tab === "pelajaran") c.innerHTML = renderPelajaran();
  else if (tab === "piket") c.innerHTML = renderPiket();
  else if (tab === "pengumuman") c.innerHTML = renderPengumuman();
  else if (tab === "agenda") c.innerHTML = renderAgenda();
  else if (tab === "struktur") c.innerHTML = renderStruktur();
  else if (tab === "akun") c.innerHTML = renderAksesAkun();
}

// ============================================
// TAB 1: INFO KELAS
// ============================================
function renderInfo() {
  const i = DATA.info || {};
  return `
    <div class="card">
      <h2>Edit Info Kelas</h2>
      <div class="admin-form">
        <div class="row">
          <div class="form-group"><label>Nama Kelas</label><input id="i-nama" value="${i.namaKelas || ""}"></div>
          <div class="form-group"><label>Wali Kelas</label><input id="i-wali" value="${i.waliKelas || ""}"></div>
          <div class="form-group"><label>Jumlah Murid</label><input id="i-jumlah" type="number" value="${i.jumlahMurid || 0}"></div>
        </div>
        <div class="row">
          <div class="form-group"><label>Tahun Ajaran</label><input id="i-tahun" value="${i.tahunAjaran || ""}"></div>
          <div class="form-group"><label>Motto</label><input id="i-motto" value="${i.motto || ""}"></div>
        </div>
        <div class="form-group"><label>Deskripsi</label><textarea id="i-desk">${i.deskripsi || ""}</textarea></div>
        <button class="btn" onclick="saveInfo()">💾 Simpan</button>
      </div>
    </div>
  `;
}

async function saveInfo() {
  const body = {
    namaKelas: $("i-nama").value,
    waliKelas: $("i-wali").value,
    jumlahMurid: +$("i-jumlah").value,
    tahunAjaran: $("i-tahun").value,
    motto: $("i-motto").value,
    deskripsi: $("i-desk").value,
  };

  const res = await fetch(API + "/api/class-info", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });

  if (res.ok) {
    DATA.info = (await res.json()).info;
    alert("✅ Info kelas disimpan!");
  } else alert("❌ Gagal simpan");
}

// ============================================
// TAB 2: PELAJARAN
// ============================================
function renderPelajaran() {
  const data = DATA.schedules || [];
  return `
    <div class="card">
      <h2>Kelola Jadwal Pelajaran</h2>
      <div class="admin-form">
        <h3>➕ Tambah Jadwal</h3>
        <div class="row">
          <div class="form-group"><label>Hari</label>
            <select id="p-hari"><option>Senin</option><option>Selasa</option><option>Rabu</option><option>Kamis</option><option>Jumat</option><option>Sabtu</option></select>
          </div>
          <div class="form-group"><label>Jam ke-</label><input id="p-jam" type="number"></div>
          <div class="form-group"><label>Waktu</label><input id="p-waktu" placeholder="07:00 - 07:45"></div>
        </div>
        <div class="row">
          <div class="form-group"><label>Mata Pelajaran</label><input id="p-mapel"></div>
          <div class="form-group"><label>Guru</label><input id="p-guru"></div>
          <div class="form-group"><label>Ruangan</label><input id="p-ruang"></div>
        </div>
        <button class="btn" onclick="addPelajaran()">➕ Tambah</button>
      </div>
      ${data.length ? `
        <table>
          <thead><tr><th>Hari</th><th>Jam</th><th>Waktu</th><th>Mapel</th><th>Guru</th><th>Ruangan</th><th>Aksi</th></tr></thead>
          <tbody>
            ${data.map(d => `
              <tr>
                <td>${d.hari}</td><td>${d.jamKe}</td><td>${d.waktu}</td>
                <td><strong>${d.mataPelajaran}</strong></td><td>${d.guru || "-"}</td><td>${d.ruangan || "-"}</td>
                <td><button class="btn-sm btn-danger" onclick="delPelajaran(${d.id})">Hapus</button></td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      ` : '<div class="empty">Belum ada jadwal.</div>'}
    </div>
  `;
}

async function addPelajaran() {
  const body = {
    hari: $("p-hari").value,
    jamKe: +$("p-jam").value,
    waktu: $("p-waktu").value,
    mataPelajaran: $("p-mapel").value,
    guru: $("p-guru").value,
    ruangan: $("p-ruang").value,
  };
  if (!body.hari || !body.jamKe || !body.waktu || !body.mataPelajaran)
    return alert("Isi semua field wajib");

  const res = await fetch(API + "/api/schedule", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });
  if (res.ok) {
    await loadAllData();
    renderTab("pelajaran");
    alert("✅ Jadwal ditambah!");
  } else alert("❌ Gagal");
}

async function delPelajaran(id) {
  if (!confirm("Hapus jadwal ini?")) return;
  await fetch(API + "/api/schedule/" + id, { method: "DELETE", credentials: "include" });
  await loadAllData();
  renderTab("pelajaran");
}

// ============================================
// TAB 3: PIKET
// ============================================
function renderPiket() {
  const data = DATA.cleanings || [];
  return `
    <div class="card">
      <h2>Kelola Jadwal Piket</h2>
      <div class="admin-form">
        <h3>➕ Atur Piket</h3>
        <div class="row">
          <div class="form-group"><label>Hari</label>
            <select id="c-hari"><option>Senin</option><option>Selasa</option><option>Rabu</option><option>Kamis</option><option>Jumat</option><option>Sabtu</option></select>
          </div>
          <div class="form-group"><label>Petugas (pisah pakai koma)</label><input id="c-petugas" placeholder="Budi, Ani, Citra"></div>
        </div>
        <div class="form-group"><label>Tugas</label><input id="c-tugas" placeholder="Menyapu, buang sampah"></div>
        <button class="btn" onclick="savePiket()">💾 Simpan</button>
      </div>
      ${data.length ? `
        <div class="piket-grid">
          ${data.map(d => `
            <div class="piket-card">
              <div class="hari">${d.hari}</div>
              <ul>${(d.petugas || []).map(p => `<li>${p}</li>`).join("")}</ul>
              ${d.tugas ? `<div class="tugas">📝 ${d.tugas}</div>` : ""}
              <button class="btn-sm btn-danger" style="margin-top:10px;" onclick="delPiket(${d.id})">Hapus</button>
            </div>
          `).join("")}
        </div>
      ` : '<div class="empty">Belum ada piket.</div>'}
    </div>
  `;
}

async function savePiket() {
  const petugas = $("c-petugas").value.split(",").map(s => s.trim()).filter(Boolean);
  if (!petugas.length) return alert("Isi minimal 1 petugas");

  const body = { hari: $("c-hari").value, petugas, tugas: $("c-tugas").value };
  const res = await fetch(API + "/api/cleaning", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });
  if (res.ok) {
    await loadAllData();
    renderTab("piket");
    alert("✅ Piket disimpan!");
  } else alert("❌ Gagal");
}

async function delPiket(id) {
  if (!confirm("Hapus piket ini?")) return;
  await fetch(API + "/api/cleaning/" + id, { method: "DELETE", credentials: "include" });
  await loadAllData();
  renderTab("piket");
}

// ============================================
// TAB 4: PENGUMUMAN
// ============================================
function renderPengumuman() {
  const data = DATA.announcements || [];
  return `
    <div class="card">
      <h2>Kelola Pengumuman</h2>
      <div class="admin-form">
        <h3>➕ Buat Pengumuman</h3>
        <div class="form-group"><label>Judul</label><input id="a-judul"></div>
        <div class="form-group"><label>Isi</label><textarea id="a-isi"></textarea></div>
        <button class="btn" onclick="addAnn()">📤 Kirim</button>
      </div>
      ${data.length ? data.map(a => {
        const tgl = a.createdAt ? new Date(a.createdAt).toLocaleString("id-ID") : "-";
        return `
          <div class="announcement">
            <h4>${a.judul}</h4>
            <div class="meta">Oleh ${a.author?.name || "?"} • ${tgl}</div>
            <div class="isi">${a.isi}</div>
            <button class="btn-sm btn-danger" style="margin-top:10px;" onclick="delAnn(${a._id})">Hapus</button>
          </div>
        `;
      }).join("") : '<div class="empty">Belum ada pengumuman.</div>'}
    </div>
  `;
}

async function addAnn() {
  const body = { judul: $("a-judul").value, isi: $("a-isi").value };
  if (!body.judul || !body.isi) return alert("Isi judul & isi");

  const res = await fetch(API + "/api/announcement", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });
  if (res.ok) {
    await loadAllData();
    renderTab("pengumuman");
    alert("✅ Terkirim!");
  } else alert("❌ Gagal");
}

async function delAnn(id) {
  if (!confirm("Hapus pengumuman ini?")) return;
  await fetch(API + "/api/announcement/" + id, { method: "DELETE", credentials: "include" });
  await loadAllData();
  renderTab("pengumuman");
}

// ============================================
// TAB 5: AGENDA
// ============================================
function renderAgenda() {
  const data = DATA.events || [];
  return `
    <div class="card">
      <h2>Kelola Agenda</h2>
      <div class="admin-form">
        <h3>➕ Tambah Agenda</h3>
        <div class="row">
          <div class="form-group"><label>Nama Agenda</label><input id="e-nama"></div>
          <div class="form-group"><label>Tanggal</label><input id="e-tanggal" type="date"></div>
          <div class="form-group"><label>Lokasi</label><input id="e-lokasi"></div>
        </div>
        <div class="form-group"><label>Deskripsi</label><textarea id="e-desk"></textarea></div>
        <button class="btn" onclick="addEvent()">➕ Tambah</button>
      </div>
      ${data.length ? data.map(e => {
        const d = new Date(e.tanggal);
        const day = isNaN(d) ? "-" : d.getDate();
        const month = isNaN(d) ? "-" : d.toLocaleString("id-ID", { month: "short" });
        return `
          <div class="event">
            <div class="date-badge">
              <div class="day">${day}</div>
              <div class="month">${month}</div>
            </div>
            <div class="info">
              <h4>${e.nama}</h4>
              <p>${e.lokasi ? "📍 " + e.lokasi : ""} ${e.deskripsi ? " • " + e.deskripsi : ""}</p>
            </div>
            <button class="btn-sm btn-danger" onclick="delEvent(${e._id})">Hapus</button>
          </div>
        `;
      }).join("") : '<div class="empty">Belum ada agenda.</div>'}
    </div>
  `;
}

async function addEvent() {
  const body = {
    nama: $("e-nama").value,
    tanggal: $("e-tanggal").value,
    lokasi: $("e-lokasi").value,
    deskripsi: $("e-desk").value,
  };
  if (!body.nama || !body.tanggal) return alert("Isi nama & tanggal");

  const res = await fetch(API + "/api/event", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });
  if (res.ok) {
    await loadAllData();
    renderTab("agenda");
    alert("✅ Agenda ditambah!");
  } else alert("❌ Gagal");
}

async function delEvent(id) {
  if (!confirm("Hapus agenda ini?")) return;
  await fetch(API + "/api/event/" + id, { method: "DELETE", credentials: "include" });
  await loadAllData();
  renderTab("agenda");
}

// ============================================
// TAB 6: STRUKTUR (CRUD dari admin)
// ============================================
function renderStruktur() {
  const data = DATA.structure || [];

  return `
    <div class="card">
      <h2>Struktur Organisasi Kelas</h2>

      <div class="admin-form">
        <h3>➕ Tambah Anggota Struktur</h3>
        <div class="row">
          <div class="form-group"><label>Nama</label><input id="s-nama" placeholder="Contoh: Budi Santoso"></div>
          <div class="form-group"><label>Jabatan</label><input id="s-jabatan" placeholder="Contoh: Ketua Kelas"></div>
          <div class="form-group"><label>Urutan (angka)</label><input id="s-urutan" type="number" value="0" placeholder="1 = paling atas"></div>
        </div>
        <button class="btn" onclick="addStruktur()">➕ Tambah</button>
      </div>

      ${
        data.length
          ? `
        <div class="tree-wrap">
          <div class="tree">
            ${buildTree(data)}
          </div>
        </div>

        <h3 style="margin-top:30px;margin-bottom:12px;">📋 Daftar Anggota</h3>
        <table>
          <thead>
            <tr><th>Nama</th><th>Jabatan</th><th>Urutan</th><th>Aksi</th></tr>
          </thead>
          <tbody>
            ${data.map((d) => `
              <tr>
                <td>${d.nama}</td>
                <td>${d.jabatan}</td>
                <td>${d.urutan}</td>
                <td><button class="btn-sm btn-danger" onclick="delStruktur(${d.id})">Hapus</button></td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      `
          : '<div class="empty">Belum ada struktur. Tambah di atas.</div>'
      }
    </div>
  `;
}

function buildTree(data) {
  const groups = {};
  data.forEach((item) => {
    const j = item.jabatan.toLowerCase();
    let key = "lainnya";
    if (j.includes("wali")) key = "walikelas";
    else if (j.includes("wakil")) key = "wakil";
    else if (j.includes("ketua")) key = "ketua";
    else if (j.includes("sekretaris")) key = "sekretaris";
    else if (j.includes("bendahara")) key = "bendahara";
    else if (j.includes("keamanan")) key = "keamanan";
    else if (j.includes("kebersihan")) key = "kebersihan";
    else if (j.includes("kesehatan")) key = "kesehatan";
    else if (j.includes("peralatan")) key = "peralatan";

    if (!groups[key]) groups[key] = [];
    groups[key].push(item);
  });

  const makeNode = (label, items, isTop = false) => {
    if (!items || !items.length) return "";
    return `
      <div class="tree-node">
        <div class="node-label">${label}</div>
        ${items.map((n) => `<div class="node-box ${isTop ? "top" : ""}">${n.nama}</div>`).join("")}
      </div>
    `;
  };

  const has = (...keys) => keys.some((k) => groups[k] && groups[k].length);

  let html = "";

  if (groups.walikelas) {
    html += `<div class="tree-level">${makeNode("Wali Kelas", groups.walikelas, true)}</div>`;
  }

  if (has("ketua", "wakil")) {
    html += `<div class="tree-level">${makeNode("Ketua Kelas", groups.ketua)}${makeNode("Wakil Ketua", groups.wakil)}</div>`;
  }

  if (has("sekretaris", "bendahara")) {
    html += `<div class="tree-level">${makeNode("Sekretaris", groups.sekretaris)}${makeNode("Bendahara", groups.bendahara)}</div>`;
  }

  if (has("keamanan", "kebersihan", "kesehatan")) {
    html += `<div class="tree-level">${makeNode("Keamanan", groups.keamanan)}${makeNode("Kebersihan", groups.kebersihan)}${makeNode("Kesehatan", groups.kesehatan)}</div>`;
  }

  if (groups.peralatan) {
    html += `<div class="tree-level">${makeNode("Peralatan", groups.peralatan)}</div>`;
  }

  if (groups.lainnya) {
    html += `<div class="tree-level">${makeNode("Anggota", groups.lainnya)}</div>`;
  }

  return html;
}

async function addStruktur() {
  const body = {
    nama: $("s-nama").value.trim(),
    jabatan: $("s-jabatan").value.trim(),
    urutan: +$("s-urutan").value || 0,
  };

  if (!body.nama || !body.jabatan) return alert("Isi nama & jabatan");

  const res = await fetch(API + "/api/structure", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });

  if (res.ok) {
    await loadAllData();
    renderTab("struktur");
    alert("✅ Ditambah!");
  } else {
    alert("❌ Gagal tambah");
  }
}

async function delStruktur(id) {
  if (!confirm("Hapus anggota ini?")) return;
  await fetch(API + "/api/structure/" + id, {
    method: "DELETE",
    credentials: "include",
  });
  await loadAllData();
  renderTab("struktur");
}

// ============================================
// TAB 7: AKSES AKUN
// ============================================
function renderAksesAkun() {
  const admins = DATA.admins || [];
  return `
    <div class="card">
      <h2>Akses Akun</h2>
      <p style="color:#94a3b8;font-size:13px;margin-bottom:15px;font-family:'JetBrains Mono',monospace;">
        // kelola akun admin & developer
      </p>
      <div class="admin-form">
        <h3>➕ Buat Akun Admin Baru</h3>
        <div class="row">
          <div class="form-group"><label>Nama Lengkap</label><input id="ak-name"></div>
          <div class="form-group"><label>Email</label><input id="ak-email" type="email"></div>
          <div class="form-group"><label>Password (min 6)</label><input id="ak-pass" type="password"></div>
        </div>
        <div class="row">
          <div class="form-group">
            <label>Role</label>
            <select id="ak-role">
              <option value="admin">Admin</option>
              <option value="developer">Developer</option>
            </select>
          </div>
          <div class="form-group"><label>Jabatan (opsional)</label><input id="ak-jabatan"></div>
        </div>
        <button class="btn" onclick="addAdmin()">➕ Buat Akun</button>
      </div>
      <h3 style="margin-top:20px;margin-bottom:12px;">📋 Daftar Akun</h3>
      ${admins.length ? `
        <table>
          <thead><tr><th>Nama</th><th>Email</th><th>Role</th><th>Jabatan</th><th>Aksi</th></tr></thead>
          <tbody>
            ${admins.map(a => `
              <tr>
                <td><strong>${a.name}</strong>${a.id === CURRENT_USER.id ? ' <span style="color:#00d4ff;font-size:11px;">(kamu)</span>' : ''}</td>
                <td>${a.email}</td>
                <td>
                  <span class="badge ${a.role === 'developer' ? 'admin' : 'anggota'}">
                    ${a.role.toUpperCase()}
                  </span>
                </td>
                <td>${a.jabatan || "-"}</td>
                <td>
                  ${a.id === CURRENT_USER.id
                    ? '<span style="color:#94a3b8;font-size:12px;">—</span>'
                    : `<button class="btn-sm btn-danger" onclick="delAdmin(${a.id})">Hapus</button>`}
                </td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      ` : '<div class="empty">Belum ada akun admin.</div>'}
    </div>
  `;
}

async function addAdmin() {
  const body = {
    name: $("ak-name").value.trim(),
    email: $("ak-email").value.trim(),
    password: $("ak-pass").value,
    role: $("ak-role").value,
    jabatan: $("ak-jabatan").value.trim(),
  };

  if (!body.name || !body.email || !body.password)
    return alert("Isi nama, email, password");
  if (body.password.length < 6) return alert("Password minimal 6 karakter");

  const res = await fetch(API + "/api/auth/admins", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });

  const data = await res.json();
  if (res.ok) {
    alert("✅ Akun admin dibuat!");
    await loadAdmins();
    renderTab("akun");
  } else {
    alert("❌ " + data.message);
  }
}

async function delAdmin(id) {
  if (!confirm("Hapus akun admin ini?")) return;

  const res = await fetch(API + "/api/auth/admins/" + id, {
    method: "DELETE",
    credentials: "include",
  });

  const data = await res.json();
  if (res.ok) {
    alert("✅ Admin dihapus!");
    await loadAdmins();
    renderTab("akun");
  } else {
    alert("❌ " + data.message);
  }
}

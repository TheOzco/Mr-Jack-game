(() => {
  "use strict";

  const LS_PATIENTS = "dental_patients";
  const LS_TREATMENTS = "dental_treatments";

  // ---------- storage helpers ----------
  const loadPatients = () => JSON.parse(localStorage.getItem(LS_PATIENTS) || "[]");
  const savePatients = (arr) => localStorage.setItem(LS_PATIENTS, JSON.stringify(arr));
  const loadTreatments = () => JSON.parse(localStorage.getItem(LS_TREATMENTS) || "[]");
  const saveTreatments = (arr) => localStorage.setItem(LS_TREATMENTS, JSON.stringify(arr));

  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  const toman = (n) => Number(n || 0).toLocaleString("fa-IR") + " تومان";
  const faDate = (iso) => {
    if (!iso) return "—";
    const d = new Date(iso + "T00:00:00");
    return d.toLocaleDateString("fa-IR");
  };

  let currentPatientId = null;

  // ---------- tab switching ----------
  function showTab(id) {
    document.querySelectorAll(".tab-panel").forEach(p => p.classList.remove("active"));
    document.getElementById("tab-" + id).classList.add("active");
    document.querySelectorAll(".tab-btn").forEach(b => b.classList.toggle("active", b.dataset.tab === id));
  }

  document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.addEventListener("click", () => showTab(btn.dataset.tab));
  });

  document.getElementById("back-to-list").addEventListener("click", () => {
    document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
    document.querySelector('.tab-btn[data-tab="patients"]').classList.add("active");
    showTab("patients");
  });

  // ---------- PATIENTS ----------
  function patientTotal(patientId) {
    return loadTreatments()
      .filter(t => t.patientId === patientId)
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);
  }

  function renderPatients(filter = "") {
    const patients = loadPatients().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const q = filter.trim().toLowerCase();
    const filtered = q
      ? patients.filter(p =>
          p.name.toLowerCase().includes(q) ||
          p.nationalId.includes(q) ||
          p.phone.includes(q))
      : patients;

    const tbody = document.getElementById("patients-tbody");
    tbody.innerHTML = "";
    document.getElementById("patient-count").textContent = patients.length.toLocaleString("fa-IR");
    document.getElementById("patients-empty").hidden = filtered.length !== 0;

    filtered.forEach(p => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td><a class="row-link" data-id="${p.id}">${escapeHtml(p.name)}</a></td>
        <td>${escapeHtml(p.nationalId)}</td>
        <td>${escapeHtml(p.phone)}</td>
        <td class="amount">${toman(patientTotal(p.id))}</td>
        <td>${faDate(p.createdAt.slice(0, 10))}</td>
        <td><button class="btn-danger-text" data-del="${p.id}">حذف</button></td>
      `;
      tbody.appendChild(tr);
    });

    tbody.querySelectorAll(".row-link").forEach(a =>
      a.addEventListener("click", () => openPatientFile(a.dataset.id)));
    tbody.querySelectorAll("[data-del]").forEach(btn =>
      btn.addEventListener("click", () => deletePatient(btn.dataset.del)));
  }

  function escapeHtml(str) {
    const d = document.createElement("div");
    d.textContent = str;
    return d.innerHTML;
  }

  document.getElementById("patient-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const name = document.getElementById("p-name").value.trim();
    const nationalId = document.getElementById("p-nid").value.trim();
    const phone = document.getElementById("p-phone").value.trim();
    if (!name || !nationalId || !phone) return;

    const patients = loadPatients();
    patients.push({ id: uid(), name, nationalId, phone, createdAt: new Date().toISOString() });
    savePatients(patients);
    e.target.reset();
    renderPatients(document.getElementById("patient-search").value);
  });

  document.getElementById("patient-search").addEventListener("input", (e) => {
    renderPatients(e.target.value);
  });

  function deletePatient(id) {
    if (!confirm("این بیمار و تمام سوابق درمانی او حذف شود؟")) return;
    savePatients(loadPatients().filter(p => p.id !== id));
    saveTreatments(loadTreatments().filter(t => t.patientId !== id));
    renderPatients(document.getElementById("patient-search").value);
    renderReports();
  }

  // ---------- PATIENT FILE ----------
  function openPatientFile(id) {
    const patient = loadPatients().find(p => p.id === id);
    if (!patient) return;
    currentPatientId = id;

    document.getElementById("file-name").textContent = patient.name;
    document.getElementById("file-nid").textContent = "کد ملی: " + patient.nationalId;
    document.getElementById("file-phone").textContent = "تلفن: " + patient.phone;
    document.getElementById("file-total").textContent = toman(patientTotal(id));

    document.getElementById("t-date").value = new Date().toISOString().slice(0, 10);
    renderTreatments();

    document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
    showTab("file");
  }

  function renderTreatments() {
    const list = loadTreatments()
      .filter(t => t.patientId === currentPatientId)
      .sort((a, b) => b.date.localeCompare(a.date));

    const tbody = document.getElementById("treatments-tbody");
    tbody.innerHTML = "";
    document.getElementById("treatments-empty").hidden = list.length !== 0;

    list.forEach(t => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${faDate(t.date)}</td>
        <td><span class="pill pill-${t.type}">${t.type}</span></td>
        <td>${t.tooth ? escapeHtml(t.tooth) : "—"}</td>
        <td class="amount">${toman(t.amount)}</td>
        <td><button class="btn-danger-text" data-del="${t.id}">حذف</button></td>
      `;
      tbody.appendChild(tr);
    });

    tbody.querySelectorAll("[data-del]").forEach(btn =>
      btn.addEventListener("click", () => deleteTreatment(btn.dataset.del)));
  }

  document.getElementById("treatment-form").addEventListener("submit", (e) => {
    e.preventDefault();
    if (!currentPatientId) return;
    const date = document.getElementById("t-date").value;
    const type = document.getElementById("t-type").value;
    const tooth = document.getElementById("t-tooth").value.trim();
    const amount = Number(document.getElementById("t-amount").value);
    if (!date || !type || !amount) return;

    const treatments = loadTreatments();
    treatments.push({ id: uid(), patientId: currentPatientId, date, type, tooth, amount, createdAt: new Date().toISOString() });
    saveTreatments(treatments);

    document.getElementById("t-type").value = "";
    document.getElementById("t-tooth").value = "";
    document.getElementById("t-amount").value = "";

    renderTreatments();
    document.getElementById("file-total").textContent = toman(patientTotal(currentPatientId));
    renderReports();
  });

  function deleteTreatment(id) {
    if (!confirm("این رکورد درمان حذف شود؟")) return;
    saveTreatments(loadTreatments().filter(t => t.id !== id));
    renderTreatments();
    document.getElementById("file-total").textContent = toman(patientTotal(currentPatientId));
    renderReports();
  }

  // ---------- REPORTS ----------
  function renderReports() {
    const monthInput = document.getElementById("report-month").value; // "YYYY-MM"
    const treatments = loadTreatments();

    // Monthly totals (all history)
    const byMonth = {};
    treatments.forEach(t => {
      const m = t.date.slice(0, 7);
      byMonth[m] = byMonth[m] || { count: 0, total: 0 };
      byMonth[m].count++;
      byMonth[m].total += Number(t.amount || 0);
    });
    const months = Object.keys(byMonth).sort().reverse();

    const monthlyBody = document.getElementById("monthly-tbody");
    monthlyBody.innerHTML = "";
    document.getElementById("monthly-empty").hidden = months.length !== 0;
    months.forEach(m => {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>${m}</td><td>${byMonth[m].count.toLocaleString("fa-IR")}</td><td class="amount">${toman(byMonth[m].total)}</td>`;
      monthlyBody.appendChild(tr);
    });

    // Daily totals for selected month
    const target = monthInput || months[0] || "";
    const dayList = treatments.filter(t => t.date.slice(0, 7) === target);
    const byDay = {};
    dayList.forEach(t => {
      byDay[t.date] = byDay[t.date] || { count: 0, total: 0 };
      byDay[t.date].count++;
      byDay[t.date].total += Number(t.amount || 0);
    });
    const days = Object.keys(byDay).sort().reverse();

    const dailyBody = document.getElementById("daily-tbody");
    dailyBody.innerHTML = "";
    document.getElementById("daily-empty").hidden = days.length !== 0;
    days.forEach(d => {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>${faDate(d)}</td><td>${byDay[d].count.toLocaleString("fa-IR")}</td><td class="amount">${toman(byDay[d].total)}</td>`;
      dailyBody.appendChild(tr);
    });

    const monthTotal = dayList.reduce((s, t) => s + Number(t.amount || 0), 0);
    document.getElementById("month-total").textContent = toman(monthTotal);
    document.getElementById("month-count").textContent = dayList.length.toLocaleString("fa-IR");
  }

  document.getElementById("report-month").addEventListener("change", renderReports);

  // ---------- EXCEL EXPORT ----------
  document.getElementById("export-excel").addEventListener("click", () => {
    const patients = loadPatients();
    const treatments = loadTreatments();

    const patientRows = patients.map(p => ({
      "نام": p.name,
      "کد ملی": p.nationalId,
      "تلفن": p.phone,
      "جمع کل درمان (تومان)": patientTotal(p.id),
      "تاریخ ثبت": p.createdAt.slice(0, 10)
    }));

    const treatmentRows = treatments.map(t => {
      const p = patients.find(pp => pp.id === t.patientId);
      return {
        "نام بیمار": p ? p.name : "—",
        "تاریخ": t.date,
        "نوع درمان": t.type,
        "شماره دندان": t.tooth || "—",
        "مبلغ (تومان)": t.amount
      };
    }).sort((a, b) => a["تاریخ"].localeCompare(b["تاریخ"]));

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(patientRows), "بیماران");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(treatmentRows), "درمان‌ها");
    XLSX.writeFile(wb, "لیست-بیماران.xlsx");
  });

  // ---------- init ----------
  document.getElementById("report-month").value = new Date().toISOString().slice(0, 7);
  renderPatients();
  renderReports();
})();

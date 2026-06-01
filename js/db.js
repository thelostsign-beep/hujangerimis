const DB = {
  DATA_VERSION: 4,

  init() {
    // Migrate old data
    if (localStorage.getItem('siiu_init') && !localStorage.getItem('siiu_version')) {
      try {
        const old = JSON.parse(localStorage.getItem('siiu'));
        if (old && old.teachers && !old.subject_list) {
          // v1 → v2: add subject_list, fix teacher subjects to array, add period_activities, incomes
          old.subject_list = ['Social','Civic','English','Indonesian','Math','Science',"Qur'an",'IFE','Javanese','ICT','Sport'];
          old.teachers = old.teachers.map(t => {
            if (typeof t.subjects === 'string') t.subjects = t.subjects ? t.subjects.split(',').map(s=>s.trim()).filter(Boolean) : [];
            return t;
          });
          if (!old.period_activities || old.period_activities.length === 0) {
            old.period_activities = [];
            old.periods.forEach(p => {
              old.activities.forEach(a => {
                if (a.isActive) old.period_activities.push({ periodId: p.id, activityId: a.id });
              });
            });
          }
          if (!old.incomes) old.incomes = [];
          localStorage.setItem('siiu', JSON.stringify(old));
          localStorage.setItem('siiu_version', '2');
        }
      } catch(e) { console.warn('Migrasi data gagal, init ulang', e); localStorage.removeItem('siiu_init'); }
    }

    // v2 → v3: replace teacher list (legacy, now superseded by v4)
    if (localStorage.getItem('siiu_init') && localStorage.getItem('siiu_version') === '2') {
      try { this._migrateV4(); } catch(e) { console.warn('Migrasi v3 gagal', e); }
    }

    // v3 → v4: replace teachers (sorted + 2 new), add committee_roles
    if (localStorage.getItem('siiu_init') && localStorage.getItem('siiu_version') === '3') {
      try { this._migrateV4(); } catch(e) { console.warn('Migrasi v4 gagal', e); }
    }

    if (!localStorage.getItem('siiu_init')) {
      const data = {
        admins: [
          { id: 'a1', username: 'admin', password: 'admin123', name: 'Admin Utama' }
        ],
        subject_list: [
          'Social', 'Civic', 'English', 'Indonesian', 'Math', 'Science',
          "Qur'an", 'IFE', 'Javanese', 'ICT', 'Sport'
        ],
        committee_roles: ['Ketua Panitia', 'Sekretaris', 'Tim Teknis'],
        teachers: [
          { id:'g1',  name:'Adila Rahmah, M.Pd', subjects:[], isActive:true, hidden:false },
          { id:'g2',  name:'Ahmad Bayu Abdullah, M.Pd', subjects:[], isActive:true, hidden:false },
          { id:'g3',  name:'Amien Nur Wicaksono, S.Ag', subjects:[], isActive:true, hidden:false },
          { id:'g4',  name:'Andi wijayanto, S.Pd', subjects:[], isActive:true, hidden:false },
          { id:'g5',  name:'Arvino Nurvieri Kusuma, S.Pd', subjects:[], isActive:true, hidden:false },
          { id:'g6',  name:'Asnia Novitasari AM, M.E', subjects:[], isActive:true, hidden:false },
          { id:'g7',  name:'Aulia Qisthi Rosyada, S.Pd', subjects:[], isActive:true, hidden:false },
          { id:'g8',  name:'Binti Qoeroti, S.Pd., M.Si', subjects:[], isActive:true, hidden:false },
          { id:'g9',  name:'Charlieta Nova Putri Fedito, S.Pd', subjects:[], isActive:true, hidden:false },
          { id:'g10', name:'Daffa Danendra Rizqi Nugraha, S.Pd', subjects:[], isActive:true, hidden:false },
          { id:'g11', name:'Danang Dwi Pambudi, S.Pd., Gr.', subjects:[], isActive:true, hidden:false },
          { id:'g12', name:'Fadlan Rifai AL-Irsyad, S.Pd', subjects:[], isActive:true, hidden:false },
          { id:'g13', name:'Farida Nur Hidayati,S.Pd', subjects:[], isActive:true, hidden:false },
          { id:'g14', name:'Fatma Roudhotul Rafida Kolis, S.Pd., Gr.', subjects:[], isActive:true, hidden:false },
          { id:'g15', name:'Febri Cahya Syahputra, S.Pd., M.Pd.', subjects:[], isActive:true, hidden:false },
          { id:'g16', name:'Fitri Nur Kolifah, S.Pd., Gr.', subjects:[], isActive:true, hidden:false },
          { id:'g17', name:'Hang Sakti Abdullah, S.Pd', subjects:[], isActive:true, hidden:false },
          { id:'g18', name:'Hari Rohmah, S.Pd', subjects:[], isActive:true, hidden:false },
          { id:'g19', name:'Ida aryani S, Sos', subjects:[], isActive:true, hidden:false },
          { id:'g20', name:'Ifan Destya Adi Tama, S. Pd', subjects:[], isActive:true, hidden:false },
          { id:'g21', name:'Iin Indah Saputri, S.Pd', subjects:[], isActive:true, hidden:false },
          { id:'g22', name:'Isti Qomah Nurul Izzati, S.Pd', subjects:[], isActive:true, hidden:false },
          { id:'g23', name:'Joko Ariyanto, ST., Gr.', subjects:[], isActive:true, hidden:false },
          { id:'g24', name:'Muamar Fariq Salafy, S.Pd, Gr.', subjects:[], isActive:true, hidden:false },
          { id:'g25', name:'Muhammad Fahmi Aziz, S.Psi', subjects:[], isActive:true, hidden:false },
          { id:'g26', name:'Muhammad Syafiq, S.Pd.', subjects:[], isActive:true, hidden:false },
          { id:'g27', name:'Mulloh, S.Pd', subjects:[], isActive:true, hidden:false },
          { id:'g28', name:'Nur rohmah hidayanti, S.Akun', subjects:[], isActive:true, hidden:false },
          { id:'g29', name:'Ramadanti Prativi, S.Pd', subjects:[], isActive:true, hidden:false },
          { id:'g30', name:'Scundy Nourma Pratiwi, S.Pd., M.Pd', subjects:[], isActive:true, hidden:false },
          { id:'g31', name:'Sharih Shadri, S.S., Gr.', subjects:[], isActive:true, hidden:false },
          { id:'g32', name:'Siti Khoimah, S.Pd., Gr.', subjects:[], isActive:true, hidden:false },
          { id:'g33', name:'Siti Robiatul Adawiyah, S.Si.', subjects:[], isActive:true, hidden:false },
          { id:'g34', name:'Siti Sirril Inayah', subjects:[], isActive:true, hidden:false },
          { id:'g35', name:'Siti Zamrotun Rizqiah, S.Pd.I', subjects:[], isActive:true, hidden:false },
          { id:'g36', name:'Syahrul Abdi Narotama, S.Ag', subjects:[], isActive:true, hidden:false },
          { id:'g37', name:'Syarah Karina Putri, S.Pd.', subjects:[], isActive:true, hidden:false },
          { id:'g38', name:'Tri Wijayanti, M.P', subjects:[], isActive:true, hidden:true },
          { id:'g39', name:'Wafda Salsabila, S.Pd.', subjects:[], isActive:true, hidden:false },
          { id:'g40', name:'Yoki Wirawan, S.Pd', subjects:[], isActive:true, hidden:false },
          { id:'g41', name:'Yona Puspa Ningtias, S.Pd', subjects:[], isActive:true, hidden:false }
        ],
        activities: [
          { id: 'k1', name: 'Membuat soal', unit: 'paket', rate: 100000, sortOrder: 1, isActive: true },
          { id: 'k2', name: 'Memasukkan soal ke LMS', unit: 'paket', rate: 30000, sortOrder: 2, isActive: true },
          { id: 'k3', name: 'Memindahkan soal ke Google Form', unit: 'paket', rate: 20000, sortOrder: 3, isActive: true },
          { id: 'k4', name: 'Koreksi siswa', unit: 'siswa', rate: 1500, sortOrder: 4, isActive: true },
          { id: 'k5', name: 'Menguji praktek', unit: 'siswa', rate: 1500, sortOrder: 5, isActive: true },
          { id: 'k6', name: 'Mengawasi TO', unit: 'sesi', rate: 10000, sortOrder: 6, isActive: true },
          { id: 'k7', name: 'Mengawasi ujian', unit: 'sesi', rate: 16000, sortOrder: 7, isActive: true },
          { id: 'k8', name: 'Membuat raport', unit: 'siswa', rate: 3000, sortOrder: 8, isActive: true },
          { id: 'k9', name: 'Matrikulasi', unit: 'kali', rate: 0, sortOrder: 9, isActive: true },
          { id: 'k10', name: 'Input nilai leger', unit: 'siswa', rate: 0, sortOrder: 10, isActive: true }
        ],
        periods: [
          { id: 'p1', name: 'PSAS 1 2526', isOpen: true }
        ],
        period_activities: [],
        submissions: [],
        incomes: [],
        classes: [
          { name:'7A', total:34 }, { name:'7B', total:33 }, { name:'7C', total:33 },
          { name:'7D', total:25 }, { name:'7E', total:24 }, { name:'7F', total:27 },
          { name:'8A', total:33 }, { name:'8B', total:33 }, { name:'8C', total:33 },
          { name:'8D', total:25 }, { name:'8E', total:24 }, { name:'8F', total:28 },
          { name:'9A', total:26 }, { name:'9B', total:33 }, { name:'9C', total:28 },
          { name:'9D', total:28 }, { name:'9E', total:35 }, { name:'9F', total:34 }
        ]
      };
      // Default: semua aktivitas terpilih di p1
      data.activities.forEach(a => {
        data.period_activities.push({ periodId: 'p1', activityId: a.id });
      });
      localStorage.setItem('siiu', JSON.stringify(data));
      localStorage.setItem('siiu_init', 'true');
      localStorage.setItem('siiu_version', String(this.DATA_VERSION));
    }

    // Safety: pastikan semua periode punya komponen
    try {
      const s = this.getData();
      let changed = false;
      s.periods.forEach(p => {
        const has = s.period_activities.some(pa => pa.periodId === p.id);
        if (!has) {
          s.activities.forEach(a => { if (a.isActive) s.period_activities.push({ periodId: p.id, activityId: a.id }); });
          changed = true;
        }
      });
      if (!s.classes || s.classes.length === 0) {
        s.classes = [
          { name:'7A', total:34 }, { name:'7B', total:33 }, { name:'7C', total:33 },
          { name:'7D', total:25 }, { name:'7E', total:24 }, { name:'7F', total:27 },
          { name:'8A', total:33 }, { name:'8B', total:33 }, { name:'8C', total:33 },
          { name:'8D', total:25 }, { name:'8E', total:24 }, { name:'8F', total:28 },
          { name:'9A', total:26 }, { name:'9B', total:33 }, { name:'9C', total:28 },
          { name:'9D', total:28 }, { name:'9E', total:35 }, { name:'9F', total:34 }
        ]; changed = true;
      }
      // migrate old classes format (count or putra → total)
      if (s.classes && s.classes[0] && s.classes[0].count !== undefined) {
        s.classes = s.classes.map(c => ({ name: c.name, total: c.count||0 })); changed = true;
      }
      if (s.classes && s.classes[0] && s.classes[0].putra !== undefined) {
        s.classes = s.classes.map(c => ({ name: c.name, total: c.total||(c.putra||0)+(c.putri||0) })); changed = true;
      }
      if (!s.committee_roles) { s.committee_roles = ['Ketua Panitia', 'Sekretaris', 'Tim Teknis']; changed = true; }
      if (changed) this.saveData(s);
    } catch(e) { /* skip */ }
  },

  getData() { return JSON.parse(localStorage.getItem('siiu')); },
  saveData(d) { localStorage.setItem('siiu', JSON.stringify(d)); },

  getSubjectList() { return this.getData().subject_list; },

  // ─── CLASSES (student count per class) ───
  getClasses() { return this.getData().classes || []; },
  addClass(data) {
    const d = this.getData(); d.classes.push(data); this.saveData(d);
  },
  updateClass(index, data) {
    const d = this.getData();
    if (d.classes && d.classes[index]) { d.classes[index] = data; this.saveData(d); }
  },
  deleteClass(index) {
    const d = this.getData();
    if (d.classes && d.classes[index]) { d.classes.splice(index, 1); this.saveData(d); }
  },

  // ─── TEACHERS ───
  getTeachers() { return this.getData().teachers.filter(t => t.isActive && !t.hidden); },
  getAllTeachers() { return this.getData().teachers; },
  addTeacher(name, subjects) {
    const d = this.getData();
    const t = { id: 'g' + Date.now(), name, subjects: subjects || [], isActive: true, hidden: false };
    d.teachers.push(t); this.saveData(d); return t;
  },
  updateTeacher(id, name, subjects) {
    const d = this.getData(); const t = d.teachers.find(x => x.id === id);
    if (t) { t.name = name; t.subjects = subjects || []; } this.saveData(d);
  },
  toggleTeacherHidden(id) {
    const d = this.getData(); const t = d.teachers.find(x => x.id === id);
    if (t) { t.hidden = !t.hidden; this.saveData(d); }
  },
  deleteTeacher(id) {
    const d = this.getData(); const t = d.teachers.find(x => x.id === id);
    if (t) t.isActive = false; this.saveData(d);
  },

  // ─── ACTIVITIES (global) ───
  getActiveActivities() { return this.getData().activities.filter(a => a.isActive).sort((a,b) => a.sortOrder - b.sortOrder); },
  getAllActivities() { return this.getData().activities.sort((a,b) => a.sortOrder - b.sortOrder); },
  addActivity(name, unit, rate) {
    const d = this.getData();
    const max = d.activities.reduce((m, a) => Math.max(m, a.sortOrder), 0);
    const a = { id: 'k' + Date.now(), name, unit, rate: parseInt(rate)||0, sortOrder: max + 1, isActive: true };
    d.activities.push(a); this.saveData(d); return a;
  },
  updateActivity(id, name, unit, rate) {
    const d = this.getData(); const a = d.activities.find(x => x.id === id);
    if (!a) return;
    if (name !== null && name !== undefined) a.name = name;
    if (unit !== null && unit !== undefined) a.unit = unit;
    if (rate !== null && rate !== undefined) a.rate = parseInt(rate)||0;
    this.saveData(d);
  },
  deleteActivity(id) {
    const d = this.getData(); const a = d.activities.find(x => x.id === id);
    if (a) a.isActive = false; this.saveData(d);
  },

  // ─── PERIODS ───
  getPeriods() { return this.getData().periods; },
  getOpenPeriods() { return this.getData().periods.filter(p => p.isOpen); },
  addPeriod(name) {
    const d = this.getData();
    const p = { id: 'p' + Date.now(), name, isOpen: true };
    d.periods.push(p); this.saveData(d); return p;
  },
  updatePeriod(id, name, isOpen) {
    const d = this.getData(); const p = d.periods.find(x => x.id === id);
    if (p) { p.name = name; p.isOpen = isOpen; } this.saveData(d);
  },
  deletePeriod(id) {
    const d = this.getData();
    d.periods = d.periods.filter(x => x.id !== id);
    d.period_activities = d.period_activities.filter(x => x.periodId !== id);
    d.submissions = d.submissions.filter(x => x.periodId !== id);
    this.saveData(d);
  },

  // ─── PERIOD-ACTIVITIES ───
  getPeriodActivities(periodId) {
    const d = this.getData();
    const pa = d.period_activities.filter(x => x.periodId === periodId);
    return d.activities.filter(a => a.isActive && pa.some(p => p.activityId === a.id)).sort((a,b) => a.sortOrder - b.sortOrder);
  },
  setPeriodActivities(periodId, activityIds) {
    const d = this.getData();
    d.period_activities = d.period_activities.filter(x => x.periodId !== periodId);
    activityIds.forEach(aid => { d.period_activities.push({ periodId, activityId: aid }); });
    this.saveData(d);
  },
  getAllPeriodActivities(periodId) {
    return this.getData().period_activities.filter(x => x.periodId === periodId).map(x => x.activityId);
  },

  // ─── SUBMISSIONS ───
  getSubmissions(periodId) {
    const d = this.getData();
    let subs = d.submissions;
    if (periodId) subs = subs.filter(s => s.periodId === periodId);
    return subs.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
  },
  getSubmission(id) { return this.getData().submissions.find(s => s.id === id); },
  getTeacherSubmission(periodId, teacherName) {
    return this.getData().submissions.find(s => s.periodId === periodId && s.teacherName === teacherName);
  },

  addSubmission(periodId, teacherName, subjects, committeeRole, items, submittedBy) {
    const d = this.getData();
    const activities = this.getActiveActivities();
    const subItems = items.map(item => {
      const act = activities.find(a => a.id === item.activityId);
      const rate = act ? act.rate : 0;
      const qty = parseInt(item.quantity) || 0;
      return {
        id: 'si' + Date.now() + Math.random().toString(36).slice(2, 6),
        activityId: item.activityId,
        activityName: act ? act.name : 'Unknown',
        quantity: qty, rate, subtotal: qty * rate, approvedQty: null
      };
    });
    const total = subItems.reduce((s, i) => s + i.subtotal, 0);
    const sub = {
      id: 's' + Date.now(), periodId, teacherName,
      subjects: Array.isArray(subjects) ? subjects : (subjects ? subjects.split(',').map(s=>s.trim()) : []),
      committeeRole: committeeRole || '',
      status: 'submitted', total, adminNotes: '',
      submittedBy: submittedBy || 'guru',
      submittedAt: new Date().toISOString(), approvedAt: new Date().toISOString(),
      items: subItems
    };
    // Auto-approve: semua submission langsung masuk hitungan
    sub.items.forEach(item => { item.approvedQty = item.quantity; });
    d.submissions.push(sub); this.saveData(d); return sub;
  },

  updateSubmissionItem(submissionId, itemId, field, value) {
    const d = this.getData();
    const sub = d.submissions.find(s => s.id === submissionId);
    if (!sub) return;
    const item = sub.items.find(i => i.id === itemId);
    if (!item) return;
    const v = parseInt(value) || 0;
    if (field === 'quantity') { item.quantity = v; item.approvedQty = v; }
    else if (field === 'approvedQty') { item.approvedQty = v; item.quantity = v; }
    item.subtotal = item.quantity * item.rate;
    sub.total = sub.items.reduce((sum, i) => sum + ((i.approvedQty !== null ? i.approvedQty : i.quantity) * i.rate), 0);
    this.saveData(d);
  },

  updateSubmissionMeta(submissionId, fields) {
    const d = this.getData();
    const sub = d.submissions.find(s => s.id === submissionId);
    if (!sub) return;
    Object.keys(fields).forEach(k => { sub[k] = fields[k]; });
    this.saveData(d);
  },

  approveItem(submissionId, itemId, approvedQty) {
    return this.updateSubmissionItem(submissionId, itemId, 'approvedQty', approvedQty);
  },

  approveAll(submissionId) {
    const d = this.getData();
    const sub = d.submissions.find(s => s.id === submissionId);
    if (!sub) return;
    sub.items.forEach(item => { if (item.approvedQty === null) item.approvedQty = item.quantity; });
    sub.total = sub.items.reduce((sum, i) => {
      const q = i.approvedQty !== null ? i.approvedQty : i.quantity;
      return sum + (q * i.rate);
    }, 0);
    sub.status = 'approved'; sub.approvedAt = new Date().toISOString();
    this.saveData(d);
  },

  rejectSubmission(submissionId, notes) {
    const d = this.getData();
    const sub = d.submissions.find(s => s.id === submissionId);
    if (sub) { sub.status = 'rejected'; sub.adminNotes = notes || ''; }
    this.saveData(d);
  },

  // ─── INCOMES ───
  getIncomes(periodId) {
    const d = this.getData();
    if (periodId) return d.incomes.filter(i => i.periodId === periodId);
    return d.incomes;
  },
  addIncome(periodId, amount, description, date) {
    const d = this.getData();
    const inc = { id: 'i' + Date.now(), periodId, amount: parseInt(amount)||0, description, date: date||new Date().toISOString().slice(0,10) };
    d.incomes.push(inc); this.saveData(d); return inc;
  },
  deleteIncome(id) {
    const d = this.getData(); d.incomes = d.incomes.filter(i => i.id !== id); this.saveData(d);
  },
  getPeriodFinance(periodId) {
    const incomes = this.getIncomes(periodId);
    const subs = this.getSubmissions(periodId);
    const totalIncome = incomes.reduce((s, i) => s + i.amount, 0);
    const totalOutcome = subs.reduce((s, sub) => s + sub.total, 0);
    return { totalIncome, totalOutcome, balance: totalIncome - totalOutcome };
  },

  // ─── STATUS ───
  getSubmissionStatus(periodId) {
    const teachers = this.getTeachers();
    const submissions = this.getSubmissions(periodId);
    return teachers.map(t => {
      const sub = submissions.find(s => s.teacherName === t.name);
      return {
        teacherId: t.id, teacherName: t.name,
        subjects: Array.isArray(t.subjects) ? t.subjects : [],
        status: sub ? sub.status : null,
        submissionId: sub ? sub.id : null,
        submittedAt: sub ? sub.submittedAt : null,
        total: sub ? sub.total : null
      };
    });
  },

  // ─── AUTH ───
  login(username, password) {
    const d = this.getData();
    const a = d.admins.find(x => x.username === username && x.password === password);
    if (a) {
      localStorage.setItem('siiu_session', JSON.stringify({ role:'admin', adminId:a.id, name:a.name }));
      return true;
    }
    return false;
  },
  logout() { localStorage.removeItem('siiu_session'); },
  getSession() { const s = localStorage.getItem('siiu_session'); return s ? JSON.parse(s) : null; },

  // ─── COMMITTEE ROLES ───
  getCommitteeRoles() {
    const d = this.getData();
    return d.committee_roles || ['Ketua Panitia', 'Sekretaris', 'Tim Teknis'];
  },
  addCommitteeRole(name) {
    const d = this.getData();
    if (!d.committee_roles) d.committee_roles = ['Ketua Panitia', 'Sekretaris', 'Tim Teknis'];
    d.committee_roles.push(name);
    this.saveData(d);
  },
  removeCommitteeRole(name) {
    const d = this.getData();
    if (d.committee_roles) { d.committee_roles = d.committee_roles.filter(r => r !== name); this.saveData(d); }
  },

  // ─── MIGRATION v4 ───
  _migrateV4() {
    const sorted = [
      'Adila Rahmah, M.Pd','Ahmad Bayu Abdullah, M.Pd','Amien Nur Wicaksono, S.Ag',
      'Andi wijayanto, S.Pd','Arvino Nurvieri Kusuma, S.Pd','Asnia Novitasari AM, M.E',
      'Aulia Qisthi Rosyada, S.Pd','Binti Qoeroti, S.Pd., M.Si','Charlieta Nova Putri Fedito, S.Pd',
      'Daffa Danendra Rizqi Nugraha, S.Pd','Danang Dwi Pambudi, S.Pd., Gr.','Fadlan Rifai AL-Irsyad, S.Pd',
      'Farida Nur Hidayati,S.Pd','Fatma Roudhotul Rafida Kolis, S.Pd., Gr.','Febri Cahya Syahputra, S.Pd., M.Pd.',
      'Fitri Nur Kolifah, S.Pd., Gr.','Hang Sakti Abdullah, S.Pd','Hari Rohmah, S.Pd',
      'Ida aryani S, Sos','Ifan Destya Adi Tama, S. Pd','Iin Indah Saputri, S.Pd',
      'Isti Qomah Nurul Izzati, S.Pd','Joko Ariyanto, ST., Gr.','Muamar Fariq Salafy, S.Pd, Gr.',
      'Muhammad Fahmi Aziz, S.Psi','Muhammad Syafiq, S.Pd.','Mulloh, S.Pd',
      'Nur rohmah hidayanti, S.Akun','Ramadanti Prativi, S.Pd','Scundy Nourma Pratiwi, S.Pd., M.Pd',
      'Sharih Shadri, S.S., Gr.','Siti Khoimah, S.Pd., Gr.','Siti Robiatul Adawiyah, S.Si.',
      'Siti Sirril Inayah','Siti Zamrotun Rizqiah, S.Pd.I','Syahrul Abdi Narotama, S.Ag',
      'Syarah Karina Putri, S.Pd.','Tri Wijayanti, M.P','Wafda Salsabila, S.Pd.',
      'Yoki Wirawan, S.Pd','Yona Puspa Ningtias, S.Pd'
    ];
    const d = JSON.parse(localStorage.getItem('siiu'));
    d.teachers = sorted.map((n, i) => ({ id: 'g' + (i + 1), name: n, subjects: [], isActive: true, hidden: false }));
    if (!d.committee_roles) d.committee_roles = ['Ketua Panitia', 'Sekretaris', 'Tim Teknis'];
    if (!d.classes || d.classes.length === 0) d.classes = [
      { name:'7A', total:34 }, { name:'7B', total:33 }, { name:'7C', total:33 },
      { name:'7D', total:25 }, { name:'7E', total:24 }, { name:'7F', total:27 },
      { name:'8A', total:33 }, { name:'8B', total:33 }, { name:'8C', total:33 },
      { name:'8D', total:25 }, { name:'8E', total:24 }, { name:'8F', total:28 },
      { name:'9A', total:26 }, { name:'9B', total:33 }, { name:'9C', total:28 },
      { name:'9D', total:28 }, { name:'9E', total:35 }, { name:'9F', total:34 }
    ];
    // migrate old classes format (count or putra → total)
    if (d.classes && d.classes[0]) {
      if (d.classes[0].count !== undefined) {
        d.classes = d.classes.map(c => ({ name: c.name, total: c.count||0 }));
      } else if (d.classes[0].putra !== undefined) {
        d.classes = d.classes.map(c => ({ name: c.name, total: c.total||(c.putra||0)+(c.putri||0) }));
      }
    }
    localStorage.setItem('siiu', JSON.stringify(d));
    localStorage.setItem('siiu_version', '4');
  }
};

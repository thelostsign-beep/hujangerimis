const DB = {
  supabase: null,
  _data: null,
  _useLocal: false,

  async init() {
    try {
      this.supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      await this._loadFromSupabase();
      this._useLocal = false;
      if (!this._data.teachers || this._data.teachers.length === 0) {
        this._seedInitial();
      }
    } catch (e) {
      console.warn('Supabase gagal, fallback localStorage:', e);
      this._useLocal = true;
      if (localStorage.getItem('siiu_init')) {
        this._data = JSON.parse(localStorage.getItem('siiu'));
      }
    }
    if (!this._data) this._seedInitial();
  },

  async _loadFromSupabase() {
    const tables = ['admins','subject_list','committee_roles','classes','teachers','activities','periods','period_activities','incomes','submissions','submission_items'];
    const results = await Promise.all(tables.map(t =>
      this.supabase.from(t).select('*').then(r => ({ key: t, data: r.data, error: r.error }))
    ));
    const data = {};
    for (const r of results) {
      if (r.error) throw r.error;
      data[r.key] = r.data || [];
    }
    const itemMap = {};
    (data.submission_items||[]).forEach(it => {
      if (!itemMap[it.submission_id]) itemMap[it.submission_id] = [];
      itemMap[it.submission_id].push(it);
    });
    this._data = {
      admins: data.admins || [],
      subject_list: (data.subject_list||[]).map(r => r.name),
      committee_roles: (data.committee_roles||[]).map(r => r.name),
      classes: (data.classes||[]),
      teachers: (data.teachers||[]).map(t => ({
        id: t.id, name: t.name, subjects: t.subjects || [],
        isActive: t.is_active ?? true, hidden: t.hidden ?? false
      })),
      activities: (data.activities||[]).sort((a,b) => (a.sort_order||0) - (b.sort_order||0)).map(a => ({
        id: a.id, name: a.name, unit: a.unit, rate: a.rate,
        sortOrder: a.sort_order, isActive: a.is_active ?? true
      })),
      periods: (data.periods||[]).map(p => ({
        id: p.id, name: p.name, isOpen: p.is_open ?? false
      })),
      period_activities: (data.period_activities||[]).map(pa => ({
        periodId: pa.period_id, activityId: pa.activity_id
      })),
      incomes: (data.incomes||[]).map(i => ({
        id: i.id, periodId: i.period_id, amount: i.amount,
        description: i.description || '', date: i.date
      })),
      submissions: (data.submissions||[]).map(s => ({
        id: s.id, periodId: s.period_id, teacherName: s.teacher_name,
        subjects: s.subjects || [], committeeRole: s.committee_role || '',
        status: s.status || 'submitted', total: s.total || 0,
        adminNotes: s.admin_notes || '', submittedBy: s.submitted_by || 'guru',
        submittedAt: s.submitted_at, approvedAt: s.approved_at,
        items: (itemMap[s.id]||[]).map(it => ({
          id: it.id, activityId: it.activity_id,
          activityName: it.activity_name, quantity: it.quantity,
          rate: it.rate, subtotal: it.subtotal, approvedQty: it.approved_qty
        }))
      }))
    };
  },

  async _saveToSupabase() {
    if (this._useLocal) return;
    const d = this._data;

    const tasks = [];

    tasks.push((async () => {
      try {
        await this.supabase.from('subject_list').delete().neq('name', '');
        const rows = d.subject_list.map(s => ({ name: s }));
        if (rows.length) await this.supabase.from('subject_list').insert(rows);
      } catch (e) { console.warn('Sync subject_list gagal:', e); }
    })());

    tasks.push((async () => {
      try {
        await this.supabase.from('committee_roles').delete().neq('name', '');
        if (d.committee_roles.length) await this.supabase.from('committee_roles').insert(d.committee_roles.map(r => ({ name: r })));
      } catch (e) { console.warn('Sync committee_roles gagal:', e); }
    })());

    tasks.push((async () => {
      try {
        if (d.classes.length) await this.supabase.from('classes').upsert(d.classes, { onConflict: 'name' });
      } catch (e) { console.warn('Sync classes gagal:', e); }
    })());

    tasks.push((async () => {
      try {
        const rows = d.teachers.map(t => ({
          id: t.id, name: t.name, is_active: t.isActive ?? true, hidden: t.hidden ?? false
        }));
        if (rows.length) await this.supabase.from('teachers').upsert(rows, { onConflict: 'id' });
      } catch (e) { console.warn('Sync teachers gagal:', e); }
    })());

    tasks.push((async () => {
      try {
        const rows = d.activities.map(a => ({
          id: a.id, name: a.name, unit: a.unit, rate: a.rate,
          sort_order: a.sortOrder, is_active: a.isActive ?? true
        }));
        if (rows.length) await this.supabase.from('activities').upsert(rows, { onConflict: 'id' });
      } catch (e) { console.warn('Sync activities gagal:', e); }
    })());

    tasks.push((async () => {
      try {
        const rows = d.periods.map(p => ({
          id: p.id, name: p.name, is_open: p.isOpen ?? false
        }));
        if (rows.length) await this.supabase.from('periods').upsert(rows, { onConflict: 'id' });
      } catch (e) { console.warn('Sync periods gagal:', e); }
    })());

    tasks.push((async () => {
      try {
        if (d.period_activities.length) {
          await this.supabase.from('period_activities').delete().neq('period_id', '');
          await this.supabase.from('period_activities').insert(d.period_activities.map(pa => ({
            period_id: pa.periodId, activity_id: pa.activityId
          })));
        }
      } catch (e) { console.warn('Sync period_activities gagal:', e); }
    })());

    tasks.push((async () => {
      try {
        for (const s of d.submissions) {
          const { items, ...subData } = s;
          await this.supabase.from('submissions').upsert({
            id: subData.id, period_id: subData.periodId, teacher_name: subData.teacherName,
            subjects: subData.subjects, committee_role: subData.committeeRole,
            status: subData.status, total: subData.total, admin_notes: subData.adminNotes,
            submitted_by: subData.submittedBy, submitted_at: subData.submittedAt,
            approved_at: subData.approvedAt
          }, { onConflict: 'id' });
          await this.supabase.from('submission_items').delete().eq('submission_id', subData.id);
          if (items && items.length) {
            await this.supabase.from('submission_items').insert(items.map(it => ({
              id: it.id, submission_id: subData.id, activity_id: it.activityId,
              activity_name: it.activityName, quantity: it.quantity,
              rate: it.rate, subtotal: it.subtotal, approved_qty: it.approvedQty
            })));
          }
        }
      } catch (e) { console.warn('Sync submissions gagal:', e); }
    })());

    tasks.push((async () => {
      try {
        const rows = d.incomes.map(i => ({
          id: i.id, period_id: i.periodId, amount: i.amount,
          description: i.description || '', date: i.date
        }));
        if (rows.length) await this.supabase.from('incomes').upsert(rows, { onConflict: 'id' });
      } catch (e) { console.warn('Sync incomes gagal:', e); }
    })());

    await Promise.all(tasks);
  },

  _seedInitial() {
    this._data = {
      admins: [{ id: 'a1', username: 'admin', password: 'admin123', name: 'Admin Utama' }],
      subject_list: ['Social','Civic','English','Indonesian','Math','Science',"Qur'an",'IFE','Javanese','ICT','Sport'],
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
      periods: [{ id: 'p1', name: 'PSAS 1 2526', isOpen: true }],
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
    this._data.activities.forEach(a => {
      this._data.period_activities.push({ periodId: 'p1', activityId: a.id });
    });
    // Save to Supabase
    this._saveToSupabase();
  },

  saveData(d) {
    this._data = d;
    this._saveToSupabase();
  },

  getData() { return this._data; },

  getSubjectList() { return this._data.subject_list; },

  // ─── CLASSES ───
  getClasses() { return this._data.classes || []; },
  addClass(data) {
    this._data.classes.push(data);
    this._saveToSupabase();
  },
  updateClass(index, data) {
    if (this._data.classes && this._data.classes[index]) {
      this._data.classes[index] = data;
      this._saveToSupabase();
    }
  },
  deleteClass(index) {
    if (this._data.classes && this._data.classes[index]) {
      this._data.classes.splice(index, 1);
      this._saveToSupabase();
    }
  },

  // ─── TEACHERS ───
  getTeachers() { return this._data.teachers.filter(t => t.isActive && !t.hidden); },
  getAllTeachers() { return this._data.teachers; },
  addTeacher(name, subjects) {
    const t = { id: 'g' + Date.now(), name, subjects: subjects || [], isActive: true, hidden: false };
    this._data.teachers.push(t);
    this._saveToSupabase();
    return t;
  },
  updateTeacher(id, name, subjects) {
    const t = this._data.teachers.find(x => x.id === id);
    if (t) { t.name = name; t.subjects = subjects || []; }
    this._saveToSupabase();
  },
  toggleTeacherHidden(id) {
    const t = this._data.teachers.find(x => x.id === id);
    if (t) { t.hidden = !t.hidden; this._saveToSupabase(); }
  },
  deleteTeacher(id) {
    const t = this._data.teachers.find(x => x.id === id);
    if (t) t.isActive = false;
    this._saveToSupabase();
  },

  // ─── ACTIVITIES (global) ───
  getActiveActivities() { return this._data.activities.filter(a => a.isActive).sort((a,b) => a.sortOrder - b.sortOrder); },
  getAllActivities() { return this._data.activities.sort((a,b) => a.sortOrder - b.sortOrder); },
  addActivity(name, unit, rate) {
    const max = this._data.activities.reduce((m, a) => Math.max(m, a.sortOrder), 0);
    const a = { id: 'k' + Date.now(), name, unit, rate: parseInt(rate)||0, sortOrder: max + 1, isActive: true };
    this._data.activities.push(a);
    this._saveToSupabase();
    return a;
  },
  updateActivity(id, name, unit, rate) {
    const a = this._data.activities.find(x => x.id === id);
    if (!a) return;
    if (name !== null && name !== undefined) a.name = name;
    if (unit !== null && unit !== undefined) a.unit = unit;
    if (rate !== null && rate !== undefined) a.rate = parseInt(rate)||0;
    this._saveToSupabase();
  },
  deleteActivity(id) {
    const a = this._data.activities.find(x => x.id === id);
    if (a) a.isActive = false;
    this._saveToSupabase();
  },

  // ─── PERIODS ───
  getPeriods() { return this._data.periods; },
  getOpenPeriods() { return this._data.periods.filter(p => p.isOpen); },
  addPeriod(name) {
    const p = { id: 'p' + Date.now(), name, isOpen: true };
    this._data.periods.push(p);
    this._saveToSupabase();
    return p;
  },
  updatePeriod(id, name, isOpen) {
    const p = this._data.periods.find(x => x.id === id);
    if (p) { p.name = name; p.isOpen = isOpen; }
    this._saveToSupabase();
  },
  deletePeriod(id) {
    this._data.periods = this._data.periods.filter(x => x.id !== id);
    this._data.period_activities = this._data.period_activities.filter(x => x.periodId !== id);
    this._data.submissions = this._data.submissions.filter(x => x.periodId !== id);
    this._saveToSupabase();
  },

  // ─── PERIOD-ACTIVITIES ───
  getPeriodActivities(periodId) {
    const pa = this._data.period_activities.filter(x => x.periodId === periodId);
    return this._data.activities.filter(a => a.isActive && pa.some(p => p.activityId === a.id)).sort((a,b) => a.sortOrder - b.sortOrder);
  },
  setPeriodActivities(periodId, activityIds) {
    this._data.period_activities = this._data.period_activities.filter(x => x.periodId !== periodId);
    activityIds.forEach(aid => { this._data.period_activities.push({ periodId, activityId: aid }); });
    this._saveToSupabase();
  },
  getAllPeriodActivities(periodId) {
    return this._data.period_activities.filter(x => x.periodId === periodId).map(x => x.activityId);
  },

  // ─── SUBMISSIONS ───
  getSubmissions(periodId) {
    let subs = this._data.submissions;
    if (periodId) subs = subs.filter(s => s.periodId === periodId);
    return subs.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
  },
  getSubmission(id) { return this._data.submissions.find(s => s.id === id); },
  getTeacherSubmission(periodId, teacherName) {
    return this._data.submissions.find(s => s.periodId === periodId && s.teacherName === teacherName);
  },

  addSubmission(periodId, teacherName, subjects, committeeRole, items, submittedBy) {
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
    sub.items.forEach(item => { item.approvedQty = item.quantity; });
    this._data.submissions.push(sub);
    this._saveToSupabase();
    return sub;
  },

  updateSubmissionItem(submissionId, itemId, field, value) {
    const sub = this._data.submissions.find(s => s.id === submissionId);
    if (!sub) return;
    const item = sub.items.find(i => i.id === itemId);
    if (!item) return;
    const v = parseInt(value) || 0;
    if (field === 'quantity') { item.quantity = v; item.approvedQty = v; }
    else if (field === 'approvedQty') { item.approvedQty = v; item.quantity = v; }
    item.subtotal = item.quantity * item.rate;
    sub.total = sub.items.reduce((sum, i) => sum + ((i.approvedQty !== null ? i.approvedQty : i.quantity) * i.rate), 0);
    this._saveToSupabase();
  },

  updateSubmissionMeta(submissionId, fields) {
    const sub = this._data.submissions.find(s => s.id === submissionId);
    if (!sub) return;
    Object.keys(fields).forEach(k => { sub[k] = fields[k]; });
    this._saveToSupabase();
  },

  approveItem(submissionId, itemId, approvedQty) {
    return this.updateSubmissionItem(submissionId, itemId, 'approvedQty', approvedQty);
  },

  approveAll(submissionId) {
    const sub = this._data.submissions.find(s => s.id === submissionId);
    if (!sub) return;
    sub.items.forEach(item => { if (item.approvedQty === null) item.approvedQty = item.quantity; });
    sub.total = sub.items.reduce((sum, i) => {
      const q = i.approvedQty !== null ? i.approvedQty : i.quantity;
      return sum + (q * i.rate);
    }, 0);
    sub.status = 'approved'; sub.approvedAt = new Date().toISOString();
    this._saveToSupabase();
  },

  rejectSubmission(submissionId, notes) {
    const sub = this._data.submissions.find(s => s.id === submissionId);
    if (sub) { sub.status = 'rejected'; sub.adminNotes = notes || ''; }
    this._saveToSupabase();
  },

  // ─── INCOMES ───
  getIncomes(periodId) {
    if (periodId) return this._data.incomes.filter(i => i.periodId === periodId);
    return this._data.incomes;
  },
  addIncome(periodId, amount, description, date) {
    const inc = { id: 'i' + Date.now(), periodId, amount: parseInt(amount)||0, description, date: date||new Date().toISOString().slice(0,10) };
    this._data.incomes.push(inc);
    this._saveToSupabase();
    return inc;
  },
  deleteIncome(id) {
    this._data.incomes = this._data.incomes.filter(i => i.id !== id);
    this._saveToSupabase();
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
    const a = this._data.admins.find(x => x.username === username && x.password === password);
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
    return this._data.committee_roles || ['Ketua Panitia', 'Sekretaris', 'Tim Teknis'];
  },
  addCommitteeRole(name) {
    if (!this._data.committee_roles) this._data.committee_roles = ['Ketua Panitia', 'Sekretaris', 'Tim Teknis'];
    this._data.committee_roles.push(name);
    this._saveToSupabase();
  },
  removeCommitteeRole(name) {
    if (this._data.committee_roles) {
      this._data.committee_roles = this._data.committee_roles.filter(r => r !== name);
      this._saveToSupabase();
    }
  }
};

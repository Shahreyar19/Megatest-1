const storageKeys = {
      questions: 'megaprep_questions',
      exams: 'megaprep_exams',
      results: 'megaprep_results',
      activity: 'megaprep_activity'
    };

    let questionEditId = null;
    let analyticsChart;
    let studentExamState = null;

    const byId = (id) => document.getElementById(id);
    const getData = (key, fallback = []) => JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
    const setData = (key, data) => localStorage.setItem(key, JSON.stringify(data));

    const showLoading = (show) => byId('loadingOverlay').classList.toggle('active', show);
    const toast = (msg) => alert(msg);

    function addActivity(text) {
      const activity = getData(storageKeys.activity);
      activity.unshift({ text, time: new Date().toLocaleString() });
      setData(storageKeys.activity, activity.slice(0, 12));
      renderDashboard();
    }

    function navTo(targetId, btn) {
      document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
      document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
      byId(targetId).classList.add('active');
      if (btn) btn.classList.add('active');
      byId('sectionTitle').textContent = btn ? btn.textContent.trim() : 'Dashboard';
    }

    function shuffle(arr) {
      const clone = [...arr];
      for (let i = clone.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [clone[i], clone[j]] = [clone[j], clone[i]];
      }
      return clone;
    }

    function toBase64(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    }

    function validateQuestionForm(question) {
      if (!question.text.trim()) return 'Question text is required.';
      if (question.type === 'mcq') {
        const values = Object.values(question.options);
        if (values.some(v => !v.trim())) return 'All MCQ options are required.';
      }
      return null;
    }

    async function saveQuestion() {
      const type = byId('qType').value;
      const question = {
        id: questionEditId || crypto.randomUUID(),
        type,
        marks: Number(byId('qMarks').value || 1),
        text: byId('qText').value.trim(),
        image: '',
        options: {
          A: byId('optA').value.trim(),
          B: byId('optB').value.trim(),
          C: byId('optC').value.trim(),
          D: byId('optD').value.trim()
        },
        correct: byId('correctAns').value
      };

      const imageFile = byId('qImage').files[0];
      if (imageFile) question.image = await toBase64(imageFile);

      const error = validateQuestionForm(question);
      if (error) return toast(error);

      const questions = getData(storageKeys.questions);
      const existingIndex = questions.findIndex(q => q.id === question.id);

      if (existingIndex >= 0) {
        question.image = question.image || questions[existingIndex].image;
        questions[existingIndex] = question;
        addActivity('Updated a question in bank.');
      } else {
        questions.push(question);
        addActivity('Added a new question.');
      }

      setData(storageKeys.questions, questions);
      clearQuestionForm();
      renderQuestions();
      renderDashboard();
    }

    function clearQuestionForm() {
      questionEditId = null;
      byId('qText').value = '';
      byId('qMarks').value = 1;
      byId('qImage').value = '';
      ['optA','optB','optC','optD'].forEach(id => byId(id).value = '');
      byId('correctAns').value = 'A';
      byId('saveQuestionBtn').textContent = 'Add Question';
    }

    function renderQuestions() {
      const search = byId('searchQuestion').value.toLowerCase();
      const filter = byId('filterType').value;
      const questions = getData(storageKeys.questions)
        .filter(q => (filter === 'all' || q.type === filter) && q.text.toLowerCase().includes(search));

      byId('questionCounter').textContent = getData(storageKeys.questions).length;
      byId('questionTableBody').innerHTML = questions.map((q, i) => {
        const details = q.type === 'mcq'
          ? `A) ${q.options.A}<br>B) ${q.options.B}<br>C) ${q.options.C}<br>D) ${q.options.D}<br><b>Ans: ${q.correct}</b>`
          : `Written • Marks: ${q.marks}`;
        return `<tr>
          <td>${i + 1}</td>
          <td>${q.type.toUpperCase()}</td>
          <td>${q.text}${q.image ? `<br><img class="image-preview" src="${q.image}" alt="question image">` : ''}</td>
          <td>${details}</td>
          <td>
            <button onclick="editQuestion('${q.id}')">Edit</button>
            <button class="btn-danger" onclick="deleteQuestion('${q.id}')">Delete</button>
          </td>
        </tr>`;
      }).join('') || '<tr><td colspan="5">No questions found.</td></tr>';

      if (window.MathJax?.typesetPromise) MathJax.typesetPromise();
    }

    window.editQuestion = (id) => {
      const q = getData(storageKeys.questions).find(item => item.id === id);
      if (!q) return;
      questionEditId = id;
      byId('qType').value = q.type;
      byId('qMarks').value = q.marks;
      byId('qText').value = q.text;
      byId('optA').value = q.options?.A || '';
      byId('optB').value = q.options?.B || '';
      byId('optC').value = q.options?.C || '';
      byId('optD').value = q.options?.D || '';
      byId('correctAns').value = q.correct || 'A';
      byId('saveQuestionBtn').textContent = 'Update Question';
      byId('mcqFields').classList.toggle('hidden', q.type !== 'mcq');
    };

    window.deleteQuestion = (id) => {
      const questions = getData(storageKeys.questions).filter(q => q.id !== id);
      setData(storageKeys.questions, questions);
      addActivity('Deleted a question.');
      renderQuestions();
      renderDashboard();
    };

    function exportJson() {
      const blob = new Blob([JSON.stringify(getData(storageKeys.questions), null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'MegaPrep_QuestionBank.json';
      a.click();
      URL.revokeObjectURL(a.href);
    }

    function importJson(file) {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const parsed = JSON.parse(reader.result);
          if (!Array.isArray(parsed)) throw new Error();
          setData(storageKeys.questions, parsed);
          addActivity('Imported question bank from JSON.');
          renderQuestions();
          renderDashboard();
        } catch {
          toast('Invalid JSON file.');
        }
      };
      reader.readAsText(file);
    }

    function buildSet(questions, setCode, meta) {
      const processed = shuffle(questions).map((q) => {
        if (q.type !== 'mcq') return { ...q, shuffledOptions: null, correctMapped: '-' };
        const entries = Object.entries(q.options);
        const shuffledEntries = shuffle(entries);
        const labels = ['A', 'B', 'C', 'D'];
        const mappedOptions = {};
        let correctMapped = 'A';
        shuffledEntries.forEach(([originalKey, value], idx) => {
          const label = labels[idx];
          mappedOptions[label] = value;
          if (originalKey === q.correct) correctMapped = label;
        });
        return { ...q, shuffledOptions: mappedOptions, correctMapped };
      });

      return { setCode, meta, questions: processed };
    }

    function renderExamPreview(exams) {
      const preview = byId('examPreview');
      const setPages = exams.map((set) => {
        const qHtml = set.questions.map((q, idx) => {
          const options = q.type === 'mcq'
            ? `<ol class="option-list">${Object.entries(q.shuffledOptions).map(([k,v]) => `<li><span class="option-label">(${k})</span> ${v}</li>`).join('')}</ol>`
            : `<p style="padding-left:34px; margin:6px 0 0;"><i>Write your answer in the answer script. (${q.marks || 1} marks)</i></p>`;
          return `<div class="question-block">
            <div class="question-line"><span class="question-no">${idx + 1}.</span><span>${q.text}</span></div>
            ${q.image ? `<img class="image-preview" src="${q.image}" alt="question image">` : ''}
            ${options}
          </div>`;
        }).join('');

        return `<article class="preview-paper">
          <header class="board-paper-header">
            <h2>${set.meta.institute}</h2>
            <h3>${set.meta.examName}</h3>
            <p style="margin:0; font-size:.95rem;">Subject: <b>${set.meta.subject}</b></p>
          </header>

          <table class="board-meta">
            <tr>
              <td><b>Date:</b> ${set.meta.date || '-'}</td>
              <td><b>Time:</b> ${set.meta.time}</td>
              <td><b>Full Marks:</b> ${set.meta.fullMarks}</td>
              <td><b>Set:</b> ${set.setCode}</td>
            </tr>
          </table>

          <div class="board-instruction">
            <b>Instructions:</b> (i) Answer all questions. (ii) For MCQ, choose the most appropriate option. (iii) Figures to the right indicate full marks.
          </div>

          ${qHtml}
        </article>`;
      }).join('<div style="page-break-after: always;"></div>');

      const answerKeyPage = `<article class="preview-paper">
        <header class="board-paper-header">
          <h2>Set-wise Answer Keys</h2>
          <p style="margin:6px 0 0;">${exams[0]?.meta?.examName || ''} • ${exams[0]?.meta?.subject || ''}</p>
        </header>
        <div class="answer-sheet">
          <div class="answer-grid">
            ${exams.map((set) => {
              const answerKey = set.questions
                .map((q, idx) => `${idx + 1}. ${q.type === 'mcq' ? q.correctMapped : '-'}`)
                .join(' | ');
              return `<div class="answer-item"><b>Set ${set.setCode}</b><br>${answerKey}</div>`;
            }).join('')}
          </div>
        </div>
      </article>`;

      preview.innerHTML = `${setPages}<div style="page-break-after: always;"></div>${answerKeyPage}`;

      if (window.MathJax?.typesetPromise) MathJax.typesetPromise();
    }

    function generateExam() {
      const allQuestions = getData(storageKeys.questions).filter(q => q.type === 'mcq' || q.type === 'written');
      if (!allQuestions.length) return toast('Add questions before generating exam sets.');

      const setCount = Math.min(4, Math.max(1, Number(byId('setCount').value || 1)));
      const count = Math.min(allQuestions.length, Math.max(1, Number(byId('questionsPerSet').value || 1)));
      const meta = {
        institute: byId('examInstitute').value.trim(),
        examName: byId('examName').value.trim(),
        subject: byId('examSubject').value.trim(),
        date: byId('examDate').value,
        time: byId('examTime').value.trim(),
        fullMarks: byId('examMarks').value.trim()
      };

      if (!meta.institute || !meta.examName || !meta.subject) return toast('Institute, Exam Name, and Subject are required.');

      const setCodes = ['A', 'B', 'C', 'D'];
      const exams = Array.from({ length: setCount }, (_, idx) => buildSet(shuffle(allQuestions).slice(0, count), setCodes[idx], meta));

      setData(storageKeys.exams, exams);
      addActivity(`Generated ${setCount} exam set(s).`);
      renderExamPreview(exams);
      renderDashboard();
    }

    async function exportPdf() {
      const exams = getData(storageKeys.exams);
      if (!exams.length) return toast('Generate an exam first.');

      showLoading(true);
      try {
        if (window.MathJax?.typesetPromise) await MathJax.typesetPromise();
        await html2pdf().set({
          margin: [8, 8, 8, 8],
          filename: 'MegaPrep_Exam.pdf',
          image: { type: 'jpeg', quality: 1 },
          html2canvas: { scale: 3, useCORS: true },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
          pagebreak: { mode: ['css', 'legacy'] }
        }).from(byId('examPreview')).save();
      } catch (err) {
        console.error(err);
        toast('PDF export failed. Check browser permissions and try again.');
      } finally {
        showLoading(false);
      }
    }

    function renderResults() {
      const results = getData(storageKeys.results);
      byId('resultTableBody').innerHTML = results.map(r => `<tr><td>${r.name}</td><td>${r.score}</td><td>${r.total}</td><td>${r.time}</td></tr>`).join('')
        || '<tr><td colspan="4">No student attempts yet.</td></tr>';
    }

    function renderDashboard() {
      const questions = getData(storageKeys.questions);
      const exams = getData(storageKeys.exams);
      const results = getData(storageKeys.results);

      byId('kpiQuestions').textContent = questions.length;
      byId('kpiExams').textContent = exams.length;
      byId('kpiAttempts').textContent = results.length;

      const mcqCount = questions.filter(q => q.type === 'mcq').length;
      const writtenCount = questions.filter(q => q.type === 'written').length;

      if (analyticsChart) analyticsChart.destroy();
      analyticsChart = new Chart(byId('analyticsChart'), {
        type: 'doughnut',
        data: {
          labels: ['MCQ', 'Written', 'Exam Sets'],
          datasets: [{
            data: [mcqCount, writtenCount, exams.length],
            backgroundColor: ['#5b6cff', '#20c997', '#ffb020']
          }]
        },
        options: { plugins: { legend: { position: 'bottom' } } }
      });

      const activity = getData(storageKeys.activity);
      byId('activityList').innerHTML = activity.map(a => `<li>${a.text} <span class="muted">(${a.time})</span></li>`).join('') || '<li class="muted">No activity yet.</li>';
    }

    function beginStudentExam() {
      const name = byId('studentName').value.trim();
      const questionCount = Number(byId('studentQCount').value || 1);
      const durationMin = Number(byId('studentDuration').value || 1);
      const mcqQuestions = getData(storageKeys.questions).filter(q => q.type === 'mcq');

      if (!name) return toast('Student name is required.');
      if (!mcqQuestions.length) return toast('No MCQ available in question bank.');

      const selected = shuffle(mcqQuestions).slice(0, Math.min(questionCount, mcqQuestions.length));
      studentExamState = {
        name,
        questions: selected,
        endTime: Date.now() + durationMin * 60 * 1000,
        timer: null
      };

      byId('studentSetup').classList.add('hidden');
      byId('studentExamCard').classList.remove('hidden');
      byId('studentScoreCard').classList.add('hidden');

      byId('studentQuestions').innerHTML = selected.map((q, i) => `
        <div class="question-block">
          <p><b>${i + 1}.</b> ${q.text}</p>
          <div>${['A','B','C','D'].map(letter => `<label style="display:block;"><input type="radio" name="q_${q.id}" value="${letter}"> ${letter}. ${q.options[letter]}</label>`).join('')}</div>
        </div>
      `).join('');

      updateTimer();
      studentExamState.timer = setInterval(updateTimer, 1000);
      if (window.MathJax?.typesetPromise) MathJax.typesetPromise();
    }

    function updateTimer() {
      if (!studentExamState) return;
      const remaining = Math.max(0, studentExamState.endTime - Date.now());
      const min = String(Math.floor(remaining / 60000)).padStart(2, '0');
      const sec = String(Math.floor((remaining % 60000) / 1000)).padStart(2, '0');
      byId('examTimer').textContent = `${min}:${sec}`;
      if (remaining <= 0) submitStudentExam(true);
    }

    function submitStudentExam(auto = false) {
      if (!studentExamState) return;
      clearInterval(studentExamState.timer);

      let score = 0;
      studentExamState.questions.forEach(q => {
        const checked = document.querySelector(`input[name="q_${q.id}"]:checked`);
        if (checked && checked.value === q.correct) score++;
      });

      const result = {
        name: studentExamState.name,
        score,
        total: studentExamState.questions.length,
        time: new Date().toLocaleString()
      };
      const results = getData(storageKeys.results);
      results.unshift(result);
      setData(storageKeys.results, results.slice(0, 100));
      addActivity(`${result.name} submitted exam ${auto ? '(auto)' : '(manual)'}: ${score}/${result.total}.`);

      byId('studentExamCard').classList.add('hidden');
      byId('studentScoreCard').classList.remove('hidden');
      byId('studentScoreCard').innerHTML = `<h3>Score: ${score}/${result.total}</h3><p class="muted">${auto ? 'Auto-submitted due to timer end.' : 'Submitted successfully.'}</p><button id="newExamBtn" class="btn-primary">Take Another Exam</button>`;
      byId('newExamBtn').onclick = resetStudentMode;

      renderResults();
      renderDashboard();
      studentExamState = null;
    }

    function resetStudentMode() {
      byId('studentSetup').classList.remove('hidden');
      byId('studentExamCard').classList.add('hidden');
      byId('studentScoreCard').classList.add('hidden');
    }

    function resetSystem() {
      Object.values(storageKeys).forEach(key => localStorage.removeItem(key));
      addActivity('System reset executed.');
      renderQuestions();
      renderResults();
      renderDashboard();
      byId('examPreview').innerHTML = '';
      resetStudentMode();
      clearQuestionForm();
    }

    function bindEvents() {
      document.querySelectorAll('.nav-btn[data-target]').forEach(btn => {
        btn.addEventListener('click', () => navTo(btn.dataset.target, btn));
      });

      byId('qType').addEventListener('change', (e) => byId('mcqFields').classList.toggle('hidden', e.target.value !== 'mcq'));
      byId('saveQuestionBtn').addEventListener('click', saveQuestion);
      byId('clearQuestionBtn').addEventListener('click', clearQuestionForm);
      byId('searchQuestion').addEventListener('input', renderQuestions);
      byId('filterType').addEventListener('change', renderQuestions);
      byId('exportJsonBtn').addEventListener('click', exportJson);
      byId('importJsonInput').addEventListener('change', (e) => e.target.files[0] && importJson(e.target.files[0]));

      byId('generateExamBtn').addEventListener('click', generateExam);
      byId('exportPdfBtn').addEventListener('click', exportPdf);

      byId('startExamBtn').addEventListener('click', beginStudentExam);
      byId('submitExamBtn').addEventListener('click', () => submitStudentExam(false));

      byId('openResetModal').addEventListener('click', () => byId('resetModal').classList.add('active'));
      byId('cancelResetBtn').addEventListener('click', () => byId('resetModal').classList.remove('active'));
      byId('confirmResetBtn').addEventListener('click', () => {
        byId('resetModal').classList.remove('active');
        resetSystem();
      });

      byId('loginBtn').addEventListener('click', () => {
        const user = byId('loginUser').value.trim();
        const pass = byId('loginPass').value.trim();
        const valid = (user === 'admin' && pass === 'admin123') || (user && pass);
        byId('loginError').classList.toggle('hidden', valid);
        if (!valid) return;
        byId('loginPage').classList.add('hidden');
        byId('app').classList.add('active');
      });

      byId('logoutBtn').addEventListener('click', () => {
        byId('app').classList.remove('active');
        byId('loginPage').classList.remove('hidden');
      });
    }

    function init() {
      bindEvents();
      renderQuestions();
      renderResults();
      renderDashboard();

      const exams = getData(storageKeys.exams);
      if (exams.length) renderExamPreview(exams);
    }

    init();

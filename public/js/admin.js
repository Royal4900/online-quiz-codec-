let auth = null;
const API = '/api/admin';

function basicAuth(user, pass) {
    return 'Basic ' + btoa(`${user}:${pass}`);
}

async function api(url, opts = {}) {
    const headers = { ...opts.headers };
    if (auth) headers['Authorization'] = auth;
    const res = await fetch(url, { ...opts, headers });
    const data = await res.json().catch(() => ({}));
    if (res.status === 401) {
        auth = null;
        document.getElementById('login-section').classList.remove('hidden');
        document.getElementById('admin-panel').classList.add('hidden');
        return null;
    }
    return data;
}

document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const user = document.getElementById('admin-user').value.trim();
    const pass = document.getElementById('admin-pass').value;
    auth = basicAuth(user, pass);
    const data = await api(`${API}/quizzes`);
    const err = document.getElementById('login-error');
    if (!data) {
        err.textContent = 'Invalid credentials';
        return;
    }
    err.textContent = '';
    document.getElementById('login-section').classList.add('hidden');
    document.getElementById('admin-panel').classList.remove('hidden');
    loadAdminQuizzes();
});

async function loadAdminQuizzes() {
    const data = await api(`${API}/quizzes`);
    if (!data) return;
    const list = document.getElementById('admin-quiz-list');
    list.innerHTML = '';
    (data.quizzes || []).forEach(q => {
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <div>
                <h2>${escapeHtml(q.title)}</h2>
                <p class="quiz-meta">${q.question_count} questions · ${q.duration_minutes} min · ${q.is_active ? 'Active' : 'Inactive'}</p>
            </div>
            <div>
                <button class="btn btn-secondary add-question-btn" data-id="${q.id}">Add Question</button>
                <button class="btn btn-secondary edit-quiz-btn" data-id="${q.id}" data-title="${escapeHtml(q.title)}" data-desc="${escapeHtml(q.description || '')}" data-duration="${q.duration_minutes}" data-active="${q.is_active}">Edit</button>
                <button class="btn btn-danger delete-quiz-btn" data-id="${q.id}">Delete</button>
            </div>
        `;
        list.appendChild(card);
    });
    list.querySelectorAll('.add-question-btn').forEach(b => b.addEventListener('click', () => openQuestionModal(b.dataset.id)));
    list.querySelectorAll('.edit-quiz-btn').forEach(b => b.addEventListener('click', () => openQuizModal(b.dataset)));
    list.querySelectorAll('.delete-quiz-btn').forEach(b => b.addEventListener('click', () => deleteQuiz(b.dataset.id)));
}

function openQuizModal(dataset = {}) {
    document.getElementById('modal-title').textContent = dataset.id ? 'Edit Quiz' : 'New Quiz';
    document.getElementById('edit-quiz-id').value = dataset.id || '';
    document.getElementById('quiz-title').value = dataset.title || '';
    document.getElementById('quiz-desc').value = dataset.desc || '';
    document.getElementById('quiz-duration').value = dataset.duration || 5;
    document.getElementById('quiz-active').checked = dataset.active !== '0';
    document.getElementById('quiz-modal').classList.remove('hidden');
}

function openQuestionModal(quizId) {
    document.getElementById('edit-question-quiz-id').value = quizId;
    document.getElementById('question-text').value = '';
    document.getElementById('question-points').value = 1;
    renderAnswerList([{ text: '', correct: false }, { text: '', correct: true }]);
    document.getElementById('question-modal').classList.remove('hidden');
}

let answerData = [];
function renderAnswerList(answers) {
    answerData = answers || answerData;
    const list = document.getElementById('answer-list');
    list.innerHTML = answerData.map((a, i) => `
        <div class="answer-row">
            <input type="radio" name="correct" ${a.correct ? 'checked' : ''} data-i="${i}">
            <input type="text" placeholder="Answer ${i + 1}" value="${escapeHtml(a.text)}" data-i="${i}">
        </div>
    `).join('');
    list.querySelectorAll('input[type="radio"]').forEach(r => r.addEventListener('change', () => {
        answerData.forEach((_, i) => answerData[i].correct = parseInt(r.dataset.i) === i);
    }));
}

document.getElementById('add-answer').addEventListener('click', () => {
    answerData.push({ text: '', correct: false });
    renderAnswerList();
});

document.getElementById('quiz-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('edit-quiz-id').value;
    const body = {
        title: document.getElementById('quiz-title').value.trim(),
        description: document.getElementById('quiz-desc').value.trim() || null,
        duration_minutes: parseInt(document.getElementById('quiz-duration').value),
        is_active: document.getElementById('quiz-active').checked
    };
    const url = id ? `${API}/quizzes/${id}` : `${API}/quizzes`;
    const method = id ? 'PUT' : 'POST';
    const data = await api(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (data && data.success) {
        document.getElementById('quiz-modal').classList.add('hidden');
        loadAdminQuizzes();
    } else if (data) {
        alert(data.errors?.[0]?.msg || data.message || 'Error');
    }
});

document.getElementById('modal-cancel').addEventListener('click', () => document.getElementById('quiz-modal').classList.add('hidden'));

document.getElementById('question-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const quizId = document.getElementById('edit-question-quiz-id').value;
    const rows = document.querySelectorAll('#answer-list .answer-row');
    const answers = [];
    let correctIdx = -1;
    rows.forEach((row, i) => {
        const txt = row.querySelector('input[type="text"]').value.trim();
        const correct = row.querySelector('input[type="radio"]').checked;
        if (txt) {
            if (correct) correctIdx = answers.length;
            answers.push({ answer_text: txt, is_correct: false });
        }
    });
    if (answers.length < 2) {
        alert('At least 2 answers required');
        return;
    }
    if (correctIdx >= 0) answers[correctIdx].is_correct = true;
    else answers[0].is_correct = true;
    const body = {
        question_text: document.getElementById('question-text').value.trim(),
        points: parseInt(document.getElementById('question-points').value) || 1,
        answers
    };
    const data = await api(`${API}/quizzes/${quizId}/questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });
    if (data && data.success) {
        document.getElementById('question-modal').classList.add('hidden');
        loadAdminQuizzes();
    } else if (data) {
        alert(data.errors?.[0]?.msg || data.message || 'Error');
    }
});

document.getElementById('question-modal-cancel').addEventListener('click', () => document.getElementById('question-modal').classList.add('hidden'));

document.getElementById('new-quiz-btn').addEventListener('click', () => openQuizModal({}));

async function deleteQuiz(id) {
    if (!confirm('Delete this quiz and all its questions?')) return;
    const data = await api(`${API}/quizzes/${id}`, { method: 'DELETE' });
    if (data && data.success) loadAdminQuizzes();
}

function escapeHtml(s) {
    if (!s) return '';
    const div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
}

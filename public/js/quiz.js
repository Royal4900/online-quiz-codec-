const params = new URLSearchParams(location.search);
const quizId = params.get('id');
if (!quizId) {
    location.href = '/';
}

let quizData, attemptId, serverStartTime, durationMinutes;
let timerInterval;

async function startQuiz() {
    try {
        const startRes = await fetch(`/api/quizzes/${quizId}/start`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({})
        });
        const startData = await startRes.json();
        if (!startData.success) throw new Error(startData.message || 'Failed to start');
        attemptId = startData.attempt_id;
        durationMinutes = startData.duration_minutes;
        serverStartTime = new Date(startData.server_start_time).getTime();
        loadQuestions();
        startTimer();
    } catch (e) {
        alert(e.message || 'Failed to start quiz');
        location.href = '/';
    }
}

async function loadQuestions() {
    const res = await fetch(`/api/quizzes/${quizId}`);
    const data = await res.json();
    if (!data.success) {
        alert(data.message || 'Failed to load quiz');
        location.href = '/';
        return;
    }
    quizData = data.quiz;
    document.getElementById('quiz-title').textContent = quizData.title;
    document.getElementById('quiz-desc').textContent = quizData.description || '';
    const container = document.getElementById('quiz-questions');
    container.innerHTML = '';
    quizData.questions.forEach((q, i) => {
        const block = document.createElement('div');
        block.className = 'question-block card';
        let opts = '';
        q.options.forEach(opt => {
            opts += `
                <label class="option">
                    <input type="radio" name="q${q.id}" value="${opt.id}" data-question-id="${q.id}">
                    <span>${escapeHtml(opt.answer_text)}</span>
                </label>
            `;
        });
        block.innerHTML = `
            <label>${i + 1}. ${escapeHtml(q.question_text)} (${q.points} pts)</label>
            <div class="options">${opts}</div>
        `;
        container.appendChild(block);
    });
    document.querySelectorAll('.option').forEach(o => o.addEventListener('click', () => {
        o.querySelector('input').checked = true;
        o.closest('.options').querySelectorAll('.option').forEach(x => x.classList.remove('selected'));
        o.classList.add('selected');
    }));
    document.getElementById('submit-btn').disabled = false;
}

function startTimer() {
    function tick() {
        const now = Date.now();
        const elapsed = (now - serverStartTime) / 1000;
        const total = durationMinutes * 60;
        const left = Math.max(0, total - elapsed);
        const m = Math.floor(left / 60);
        const s = Math.floor(left % 60);
        const el = document.getElementById('timer');
        el.textContent = `${m}:${s.toString().padStart(2,'0')}`;
        el.classList.remove('warning', 'danger');
        if (left <= 60) el.classList.add('warning');
        if (left <= 15) el.classList.add('danger');
        if (left <= 0) {
            clearInterval(timerInterval);
            submitQuiz(true);
        }
    }
    tick();
    timerInterval = setInterval(tick, 1000);
}

async function submitQuiz(timeUp = false) {
    clearInterval(timerInterval);
    const answers = [];
    document.querySelectorAll('input[type="radio"]:checked').forEach(inp => {
        answers.push({ question_id: parseInt(inp.dataset.questionId), answer_id: parseInt(inp.value) });
    });
    try {
        const res = await fetch(`/api/quizzes/${quizId}/submit`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ attempt_id: attemptId, answers })
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.message || 'Submission failed');
        const qs = new URLSearchParams({
            score: data.score,
            max: data.max_score,
            pct: data.percentage,
            time: data.time_taken_seconds
        });
        location.href = `/result.html?${qs}`;
    } catch (e) {
        if (timeUp) {
            alert('Time is up. Your answers could not be submitted in time.');
        } else {
            alert(e.message || 'Submission failed');
        }
        location.href = '/';
    }
}

document.getElementById('submit-btn').addEventListener('click', () => {
    const total = document.querySelectorAll('input[type="radio"]').length / (quizData?.questions?.length || 1);
    const selected = document.querySelectorAll('input[type="radio"]:checked').length;
    if (selected < (quizData?.questions?.length || 0)) {
        if (!confirm('You have not answered all questions. Submit anyway?')) return;
    }
    submitQuiz(false);
});

function escapeHtml(s) {
    const div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
}

startQuiz();

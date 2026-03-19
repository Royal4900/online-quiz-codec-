async function loadQuizzes() {
    const list = document.getElementById('quiz-list');
    const loading = document.getElementById('loading');
    const empty = document.getElementById('empty');
    try {
        const res = await fetch('/api/quizzes');
        const data = await res.json();
        loading.classList.add('hidden');
        if (!data.success || !data.quizzes.length) {
            empty.classList.remove('hidden');
            return;
        }
        data.quizzes.forEach(q => {
            const card = document.createElement('div');
            card.className = 'card';
            card.innerHTML = `
                <div>
                    <h2>${escapeHtml(q.title)}</h2>
                    <p class="quiz-meta">${q.question_count} questions · ${q.duration_minutes} min</p>
                    ${q.description ? `<p>${escapeHtml(q.description)}</p>` : ''}
                </div>
                <a href="/quiz.html?id=${q.id}" class="btn btn-primary">Start Quiz</a>
            `;
            list.appendChild(card);
        });
    } catch (e) {
        loading.textContent = 'Failed to load quizzes.';
    }
}

function escapeHtml(s) {
    const div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
}

loadQuizzes();

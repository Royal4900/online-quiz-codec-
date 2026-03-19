const params = new URLSearchParams(location.search);
const score = params.get('score') || 0;
const max = params.get('max') || 0;
const pct = params.get('pct') || 0;
const time = params.get('time') || 0;

document.getElementById('score-display').textContent = `${score} / ${max}`;
document.getElementById('percentage').textContent = `${pct}%`;
document.getElementById('time-taken').textContent = time ? `Time taken: ${Math.floor(time / 60)}m ${time % 60}s` : '';

/**
 * Portfolio Frontend - Fetches dynamic content from REST API
 */

const API_BASE = '/api';

// DOM elements
const heroName = document.getElementById('hero-name');
const heroTitle = document.getElementById('hero-title');
const heroBio = document.getElementById('hero-bio');
const heroSocial = document.getElementById('hero-social');
const aboutContent = document.getElementById('about-content');
const skillsGrid = document.getElementById('skills-grid');
const projectsGrid = document.getElementById('projects-grid');
const contactForm = document.getElementById('contact-form');
const formMessage = document.getElementById('form-message');
const submitBtn = document.getElementById('submit-btn');

// Fetch helpers
async function fetchAPI(endpoint) {
  const res = await fetch(`${API_BASE}${endpoint}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

function showError(element, msg) {
  element.innerHTML = `<p class="loading" style="color: var(--color-error);">${msg}</p>`;
}

// Nav toggle (mobile)
const navToggle = document.getElementById('nav-toggle');
const navMenu = document.getElementById('nav-menu');

navToggle?.addEventListener('click', () => {
  navToggle.classList.toggle('is-active');
  navMenu.classList.toggle('is-open');
});

document.querySelectorAll('.nav__link').forEach(link => {
  link.addEventListener('click', () => {
    navToggle.classList.remove('is-active');
    navMenu.classList.remove('is-open');
  });
});

// Year in footer
document.getElementById('year').textContent = new Date().getFullYear();

// Load profile
async function loadProfile() {
  try {
    const profile = await fetchAPI('/profile');
    heroName.textContent = profile.name;
    heroTitle.textContent = profile.title;
    heroBio.textContent = profile.bio;

    if (profile.socialLinks) {
      const links = [];
      if (profile.socialLinks.github) links.push(`<a href="${profile.socialLinks.github}" target="_blank" rel="noopener">GitHub</a>`);
      if (profile.socialLinks.linkedin) links.push(`<a href="${profile.socialLinks.linkedin}" target="_blank" rel="noopener">LinkedIn</a>`);
      if (profile.socialLinks.twitter) links.push(`<a href="${profile.socialLinks.twitter}" target="_blank" rel="noopener">Twitter</a>`);
      heroSocial.innerHTML = links.join(' · ');
    }

    aboutContent.innerHTML = `
      <p>${profile.bio}</p>
      ${profile.location ? `<p><strong>Location:</strong> ${profile.location}</p>` : ''}
      ${profile.email ? `<p><strong>Email:</strong> <a href="mailto:${profile.email}">${profile.email}</a></p>` : ''}
    `;
  } catch (err) {
    heroName.textContent = 'Developer';
    heroTitle.textContent = 'Full-Stack Engineer';
    heroBio.textContent = 'Welcome to my portfolio. Connect with me below.';
    aboutContent.innerHTML = '<p>Profile data will appear when the backend is connected.</p>';
  }
}

// Load skills
async function loadSkills() {
  try {
    const skills = await fetchAPI('/skills');
    const byCategory = {};
    skills.forEach(s => {
      if (!byCategory[s.category]) byCategory[s.category] = [];
      byCategory[s.category].push(s);
    });

    skillsGrid.innerHTML = Object.entries(byCategory).map(([cat, items]) =>
      items.map(s => `
        <div class="skill__card">
          <span class="skill__name">${escapeHtml(s.name)}</span>
          <span class="skill__category">${escapeHtml(cat)}</span>
        </div>
      `).join('')
    ).join('');
  } catch (err) {
    showError(skillsGrid, 'Unable to load skills.');
  }
}

// Load projects
async function loadProjects() {
  try {
    const projects = await fetchAPI('/projects');
    projectsGrid.innerHTML = projects.map(p => `
      <article class="project__card">
        <div class="project__image">📁</div>
        <div class="project__body">
          <h3 class="project__title">${escapeHtml(p.title)}</h3>
          <p class="project__desc">${escapeHtml(p.description)}</p>
          ${p.technologies?.length ? `<div class="project__tech">${p.technologies.map(t => `<span>${escapeHtml(t)}</span>`).join('')}</div>` : ''}
          <div class="project__links">
            ${p.liveUrl ? `<a href="${escapeHtml(p.liveUrl)}" target="_blank" rel="noopener">Live</a>` : ''}
            ${p.repoUrl ? `<a href="${escapeHtml(p.repoUrl)}" target="_blank" rel="noopener">Repo</a>` : ''}
          </div>
        </div>
      </article>
    `).join('');
  } catch (err) {
    showError(projectsGrid, 'Unable to load projects.');
  }
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text || '';
  return div.innerHTML;
}

// Contact form
contactForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  formMessage.textContent = '';
  formMessage.className = 'form__message';
  document.querySelectorAll('.form__error').forEach(el => el.textContent = '');

  const data = {
    name: document.getElementById('name').value.trim(),
    email: document.getElementById('email').value.trim(),
    subject: document.getElementById('subject').value.trim(),
    message: document.getElementById('message').value.trim()
  };

  submitBtn.disabled = true;
  submitBtn.textContent = 'Sending...';

  try {
    const res = await fetch(`${API_BASE}/contact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const json = await res.json();

    if (res.ok && json.success) {
      formMessage.textContent = json.message || 'Message sent!';
      formMessage.className = 'form__message success';
      contactForm.reset();
    } else {
      if (json.errors) {
        json.errors.forEach(err => {
          const el = document.querySelector(`[data-field="${err.field}"]`);
          if (el) el.textContent = err.message;
        });
      }
      formMessage.textContent = json.message || 'Something went wrong.';
      formMessage.className = 'form__message error';
    }
  } catch (err) {
    formMessage.textContent = 'Network error. Please try again.';
    formMessage.className = 'form__message error';
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Send Message';
  }
});

// Init
loadProfile();
loadSkills();
loadProjects();

import { openWordReview, unlockedLevel } from './vocabulary.js';

const profileKey = 'spanish-study.profile';
const activityKey = 'spanish-study.profile-active';
const welcomeScreen = document.querySelector('#welcome-screen');
const welcomeTitle = document.querySelector('#welcome-title');
const createButton = document.querySelector('#create-local-profile');
const continueButton = document.querySelector('#continue-local-profile');
const leaveButtons = document.querySelectorAll('[data-leave-profile]');
const pathUsername = document.querySelector('#path-username');
const usernameScreen = document.querySelector('#username-screen');
const usernameForm = document.querySelector('#username-form');
const usernameInput = document.querySelector('#username');
const usernameError = document.querySelector('#username-error');
const course = document.querySelector('#spanish-course');
const courseViews = document.querySelectorAll('.course-feed > section');
const path = document.querySelector('.path');
const pathTitle = document.querySelector('#path-title');
const learningHome = document.querySelector('#learning-home');
const learningTitle = document.querySelector('#learning-title');
const learningUsername = document.querySelector('#learning-username');
const courseProgress = document.querySelector('#course-progress');

const workedExample = document.querySelector('#worked-example');
for (const example of document.querySelectorAll('[data-worked-example]')) {
  example.append(workedExample.content.cloneNode(true));
}

function readProfile() {
  try {
    return JSON.parse(localStorage.getItem(profileKey));
  } catch {
    return null;
  }
}

let username = '';

function loadProfile(profile) {
  username = typeof profile?.username === 'string' ? profile.username.trim() : '';
}

loadProfile(readProfile());
let active = Boolean(username);
try {
  active = active && localStorage.getItem(activityKey) !== 'false';
} catch {
  // Existing profiles can still be used when storage is unavailable.
}

function setActive(value) {
  active = value;
  try {
    localStorage.setItem(activityKey, String(value));
  } catch {
    // The active state still applies for this visit.
  }
}

function saveProfile() {
  try {
    localStorage.setItem(profileKey, JSON.stringify({ username, language: 'es' }));
  } catch {
    // Setup still works for this visit when browser storage is unavailable.
  }
}

function showScreen(moveFocus = false, choosingUsername = false) {
  welcomeScreen.hidden = choosingUsername || active;
  usernameScreen.hidden = !choosingUsername;
  course.hidden = true;
  learningHome.hidden = !active;
  createButton.hidden = Boolean(username);
  continueButton.hidden = !username;
  continueButton.textContent = username ? `Continue as ${username}` : '';
  pathUsername.textContent = username;
  learningUsername.textContent = username;
  courseProgress.textContent = unlockedLevel() === 2
    ? 'Level 1 review passed · Level 2 unlocked'
    : 'Level 1 available · Level 2 locked';

  if (moveFocus) {
    const nextFocus = choosingUsername ? usernameInput : active ? learningTitle : welcomeTitle;
    nextFocus.focus();
  }
}

createButton.addEventListener('click', () => {
  if (!username) showScreen(true, true);
});

continueButton.addEventListener('click', () => {
  if (!username) return;
  setActive(true);
  showScreen(true);
});

for (const button of leaveButtons) {
  button.addEventListener('click', () => {
    setActive(false);
    showScreen(true);
  });
}

function hideCourseViews() {
  for (const view of courseViews) view.hidden = true;
}

function showLearningPath() {
  hideCourseViews();
  path.hidden = false;
  pathTitle.focus();
}

for (const button of document.querySelectorAll('[data-open-spanish]')) {
  button.addEventListener('click', () => {
    learningHome.hidden = true;
    course.hidden = false;
    showLearningPath();
  });
}

document.querySelector('#sidebar-learning-path').addEventListener('click', showLearningPath);
document.querySelector('#start-review').addEventListener('click', () => {
  hideCourseViews();
  openWordReview();
});

for (const button of document.querySelectorAll('[data-course-target]')) {
  button.addEventListener('click', () => {
    const target = document.getElementById(button.dataset.courseTarget);
    if (target.disabled) return;
    hideCourseViews();
    target.click();
  });
}

document.querySelector('#back-to-learning').addEventListener('click', () => showScreen(true));

usernameForm.addEventListener('submit', (event) => {
  event.preventDefault();
  if (username) return;
  // A profile may have been created in another tab while this form was open.
  loadProfile(readProfile());
  if (username) {
    showScreen(true);
    return;
  }

  const enteredName = usernameInput.value.trim();
  if (!enteredName) {
    usernameInput.setAttribute('aria-invalid', 'true');
    usernameError.textContent = 'Enter a username to continue.';
    usernameInput.focus();
    return;
  }

  username = enteredName;
  saveProfile();
  setActive(true);
  showScreen(true);
});

usernameInput.addEventListener('input', () => {
  usernameInput.removeAttribute('aria-invalid');
  usernameError.textContent = '';
});

showScreen();

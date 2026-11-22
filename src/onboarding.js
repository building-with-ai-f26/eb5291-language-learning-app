const profileKey = 'spanish-study.profile';
const activityKey = 'spanish-study.profile-active';
const welcomeScreen = document.querySelector('#welcome-screen');
const welcomeTitle = document.querySelector('#welcome-title');
const createButton = document.querySelector('#create-local-profile');
const continueButton = document.querySelector('#continue-local-profile');
const leaveButton = document.querySelector('#leave-profile');
const pathUsername = document.querySelector('#path-username');
const usernameScreen = document.querySelector('#username-screen');
const languageScreen = document.querySelector('#language-screen');
const usernameForm = document.querySelector('#username-form');
const usernameInput = document.querySelector('#username');
const usernameError = document.querySelector('#username-error');
const languageTitle = document.querySelector('#language-title');
const spanishButton = document.querySelector('#choose-spanish');
const intro = document.querySelector('.intro');
const path = document.querySelector('.path');
const pathTitle = document.querySelector('#path-title');

function readProfile() {
  try {
    return JSON.parse(localStorage.getItem(profileKey));
  } catch {
    return null;
  }
}

let username = '';
let language = '';

function loadProfile(profile) {
  username = typeof profile?.username === 'string' ? profile.username.trim() : '';
  language = username && profile?.language === 'es' ? 'es' : '';
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
    localStorage.setItem(profileKey, JSON.stringify({ username, language }));
  } catch {
    // Setup still works for this visit when browser storage is unavailable.
  }
}

function showScreen(moveFocus = false, choosingUsername = false) {
  const ready = active && Boolean(language);
  const choosingLanguage = active && !ready;
  welcomeScreen.hidden = choosingUsername || active;
  usernameScreen.hidden = !choosingUsername;
  languageScreen.hidden = !choosingLanguage;
  intro.hidden = !ready;
  path.hidden = !ready;
  createButton.hidden = Boolean(username);
  continueButton.hidden = !username;
  continueButton.textContent = username ? `Continue as ${username}` : '';
  pathUsername.textContent = username;

  if (moveFocus) {
    const nextFocus = choosingUsername ? usernameInput : ready ? pathTitle
      : choosingLanguage ? languageTitle : welcomeTitle;
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

leaveButton.addEventListener('click', () => {
  setActive(false);
  showScreen(true);
});

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

spanishButton.addEventListener('click', () => {
  language = 'es';
  saveProfile();
  showScreen(true);
});

showScreen();

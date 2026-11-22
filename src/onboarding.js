const profileKey = 'spanish-study.profile';
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

const savedProfile = readProfile();
let username = typeof savedProfile?.username === 'string' ? savedProfile.username.trim() : '';
let language = username && savedProfile?.language === 'es' ? 'es' : '';

function saveProfile() {
  try {
    localStorage.setItem(profileKey, JSON.stringify({ username, language }));
  } catch {
    // Setup still works for this visit when browser storage is unavailable.
  }
}

function showScreen(moveFocus = false) {
  const ready = Boolean(username && language);
  usernameScreen.hidden = Boolean(username);
  languageScreen.hidden = !username || ready;
  intro.hidden = !ready;
  path.hidden = !ready;

  if (moveFocus) (ready ? pathTitle : languageTitle).focus();
}

usernameForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const enteredName = usernameInput.value.trim();
  if (!enteredName) {
    usernameInput.setAttribute('aria-invalid', 'true');
    usernameError.textContent = 'Enter a username to continue.';
    usernameInput.focus();
    return;
  }

  username = enteredName;
  saveProfile();
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

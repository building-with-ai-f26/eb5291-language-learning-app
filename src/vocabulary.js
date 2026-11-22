import { everydayWords, vocabulary } from './vocabulary-content.js';
import { openSentences } from './sentences.js';
import { shuffle } from './shuffle.js';
import { createHearIt } from './lesson-audio.js';

const path = document.querySelector('.path');
const openButton = document.querySelector('#open-vocabulary');
const card = document.querySelector('#vocabulary');
const title = document.querySelector('#vocabulary-title');
const question = document.querySelector('#vocabulary-question');
const word = document.querySelector('#vocabulary-word');
const answerButtons = document.querySelectorAll('#answer-choices button');
const feedback = document.querySelector('#answer-feedback');
const example = document.querySelector('#vocabulary-example');
const exampleSentence = document.querySelector('#example-sentence');
const exampleMeaning = document.querySelector('#example-meaning');
const meaning = document.querySelector('#vocabulary-meaning');
const revealButton = document.querySelector('#reveal-meaning');
const nextButton = document.querySelector('#next-card');
const reviewProgress = document.querySelector('#review-progress');
const practiceSummary = document.querySelector('#practice-summary');
const practiceSummaryTitle = document.querySelector('#practice-summary-title');
const practiceSummaryProgress = document.querySelector('#practice-summary-progress');
const practiceAgainButton = document.querySelector('#practice-again');
const practiceSummaryBack = document.querySelector('#practice-summary-back');
const reviewResult = document.querySelector('#review-result');
const reviewScore = document.querySelector('#review-score');
const reviewOutcome = document.querySelector('#review-outcome');
const retryReviewButton = document.querySelector('#retry-review');
const startLevelTwoButton = document.querySelector('#start-level-two');
const practiceReviewWordsButton = document.querySelector('#practice-review-words');
const backButton = document.querySelector('#back-to-path');
const levelTwo = document.querySelector('#level-two');
const levelTwoDescription = document.querySelector('#level-two-description');
const levelTwoStatus = document.querySelector('#level-two-status');
const levelOneStatus = document.querySelector('#level-one-status');
const levelOneAction = document.querySelector('#level-one-action');
const levelTwoAction = document.querySelector('#level-two-action');
const sidebarLevelTwo = document.querySelector('#sidebar-level-two');
const sidebarLevelTwoStatus = document.querySelector('#sidebar-level-two-status');

const reviewLength = 5;
const passingScore = 4;
const unlockKey = 'spanish-study.level-two-unlocked';
const practiceSessions = new Map();

let cardIndex = 0;
let answerRecorded = false;
let reviewWords = null;
let score = 0;
let practice;
let hearIt;

export function unlockedLevel() {
  return levelTwo.disabled ? 1 : 2;
}

function showLevelTwoUnlocked() {
  levelTwo.classList.remove('level--locked');
  levelTwo.disabled = false;
  levelTwoDescription.textContent = 'Put Spanish word tiles in order to build a sentence.';
  levelTwoStatus.textContent = 'Unlocked';
  levelOneStatus.textContent = 'Review passed';
  levelOneAction.textContent = 'Practice';
  levelOneAction.removeAttribute('data-next');
  levelTwoAction.hidden = false;
  sidebarLevelTwo.disabled = false;
  sidebarLevelTwoStatus.hidden = true;
}

try {
  if (localStorage.getItem(unlockKey) === 'true') showLevelTwoUnlocked();
} catch {
  // The quiz still works when browser storage is unavailable.
}

function similarity(entry, candidate) {
  const sharesContext = candidate.contexts.some((context) => entry.contexts.includes(context));
  const sharesPartOfSpeech = candidate.partOfSpeech === entry.partOfSpeech;
  return Number(sharesContext) + Number(sharesPartOfSpeech);
}

function answerChoices(entry, choicePool) {
  const alternatives = shuffle(choicePool.filter((candidate) => candidate.english !== entry.english))
    .sort((first, second) => similarity(entry, second) - similarity(entry, first));
  const distinctMeanings = new Set(alternatives.map((candidate) => candidate.english));
  return shuffle([entry.english, ...[...distinctMeanings].slice(0, 2)]);
}

function showCard(index) {
  cardIndex = index;
  answerRecorded = false;

  const reviewing = reviewWords !== null;
  const words = reviewWords ?? practice.entries;
  const entry = words[cardIndex];
  const useFirstLessonChoices = reviewing || (!practice.onBack && cardIndex < everydayWords.length);
  const choices = answerChoices(entry, useFirstLessonChoices ? everydayWords : practice.alternatives);
  const lastCard = cardIndex === words.length - 1;

  question.hidden = false;
  practiceSummary.hidden = true;
  reviewResult.hidden = true;
  reviewProgress.hidden = false;
  reviewProgress.textContent = reviewing
    ? `Question ${cardIndex + 1} of ${reviewLength}`
    : practiceProgress(index + Number(practice.answered));
  word.textContent = entry.spanish;
  if (import.meta.env.DEV) {
    hearIt?.remove();
    hearIt = undefined;
    if (!reviewing) {
      hearIt = createHearIt(entry.id, entry.spanish);
      revealButton.before(hearIt);
    }
  }
  meaning.textContent = entry.english;
  meaning.hidden = true;
  revealButton.setAttribute('aria-expanded', 'false');
  feedback.textContent = '';
  feedback.removeAttribute('data-result');
  example.hidden = true;
  exampleSentence.textContent = entry.example.spanish;
  exampleMeaning.textContent = entry.example.english;
  revealButton.hidden = reviewing;
  nextButton.hidden = reviewing;
  nextButton.textContent = reviewing ? 'Continue' : lastCard ? 'Finish practice'
    : (index + 1) % practice.setSize === 0 ? 'Next set' : 'Next card';

  answerButtons.forEach((button, choiceIndex) => {
    button.textContent = choices[choiceIndex];
    button.removeAttribute('aria-disabled');
    button.removeAttribute('data-result');
  });
  if (!reviewing && practice.answered) {
    showAnswer(entry, [...answerButtons].find((button) => button.textContent === entry.english), true);
  }
  word.focus();
}

function practiceProgress(count) {
  return `${count} of ${practice.entries.length} words practiced`;
}

function finishPractice() {
  question.hidden = true;
  practiceSummary.hidden = false;
  practiceSummaryTitle.textContent = practice.onBack
    ? 'You’ve reached the end of this topic’s unlocked words.'
    : 'You’ve practiced all your unlocked words.';
  practiceSummaryProgress.textContent = practiceProgress(practice.index);
  practiceSummaryBack.textContent = practice.onBack ? 'Back to topic' : 'Back to learning path';
  practiceSummaryTitle.focus();
}

function startReview() {
  reviewWords = shuffle(everydayWords).slice(0, reviewLength);
  score = 0;
  title.textContent = 'Level 1 review';
  showCard(0);
}

function finishReview() {
  const passed = score >= passingScore;
  question.hidden = true;
  reviewResult.hidden = false;
  reviewScore.textContent = `Score: ${score}/${reviewLength}`;
  let unlockedForVisit = false;
  if (passed) {
    showLevelTwoUnlocked();
    try {
      localStorage.setItem(unlockKey, 'true');
    } catch {
      unlockedForVisit = true;
    }
  }

  const canStartLevelTwo = unlockedLevel() === 2;
  reviewOutcome.textContent = canStartLevelTwo
    ? unlockedForVisit ? 'Level 2 unlocked for this visit.' : 'Level 2 is unlocked.'
    : `Get at least ${passingScore}/${reviewLength} to unlock Level 2.`;
  startLevelTwoButton.hidden = !canStartLevelTwo;
  retryReviewButton.hidden = passed;
  practiceReviewWordsButton.hidden = canStartLevelTwo;
  reviewScore.focus();
}

function openWordView(onBack, viewTitle) {
  backButton.textContent = onBack ? '← Topic' : '← Learning path';
  path.hidden = true;
  card.hidden = false;
  title.textContent = viewTitle;
}

export function openWords(entries, { key, alternatives, setSize, onBack = null }) {
  practice = practiceSessions.get(key) ?? { entries: [], index: 0, answered: false };
  const existingIds = new Set(practice.entries.map(({ id }) => id));
  practice.entries.push(...entries.filter(({ id }) => !existingIds.has(id)));
  Object.assign(practice, { alternatives, setSize, onBack });
  practiceSessions.set(key, practice);
  reviewWords = null;
  openWordView(onBack, onBack ? 'Practice words' : 'Everyday words');
  if (practice.index === practice.entries.length) {
    reviewResult.hidden = true;
    finishPractice();
  } else {
    showCard(practice.index);
  }
}

function openEverydayWords() {
  const firstIds = new Set(everydayWords.map(({ id }) => id));
  const unlocked = vocabulary.filter(({ level }) => level <= unlockedLevel());
  const entries = [...everydayWords, ...unlocked.filter(({ id }) => !firstIds.has(id))];
  openWords(entries, { key: 'everyday', alternatives: unlocked, setSize: everydayWords.length });
}

openButton.addEventListener('click', openEverydayWords);

function showAnswer(entry, button, correct) {
  const result = correct ? 'correct' : 'incorrect';
  answerButtons.forEach((choice) => choice.removeAttribute('data-result'));
  button.setAttribute('data-result', result);
  feedback.setAttribute('data-result', result);
  if (!reviewWords && !correct) {
    feedback.textContent = 'Try again.';
    return;
  }

  answerRecorded = true;
  const translation = `${entry.spanish} means ${entry.english}.`;
  feedback.textContent = correct ? `Correct! ${translation}` : `Incorrect. ${translation}`;
  example.hidden = !correct;
  answerButtons.forEach((choice) => choice.setAttribute('aria-disabled', 'true'));
}

answerButtons.forEach((button) => {
  button.addEventListener('click', () => {
    if (answerRecorded) return;

    const reviewing = reviewWords !== null;
    const words = reviewWords ?? practice.entries;
    const entry = words[cardIndex];
    const correct = button.textContent === entry.english;
    showAnswer(entry, button, correct);
    if (reviewing) {
      score += Number(correct);
      nextButton.hidden = false;
    } else if (correct) {
      practice.answered = true;
      reviewProgress.textContent = practiceProgress(cardIndex + 1);
    }
  });
});

export function openWordReview() {
  openWordView(null, 'Level 1 review');
  startReview();
}

retryReviewButton.addEventListener('click', startReview);
practiceReviewWordsButton.addEventListener('click', openEverydayWords);
startLevelTwoButton.addEventListener('click', () => {
  if (unlockedLevel() !== 2) return;
  card.hidden = true;
  openSentences();
});
nextButton.addEventListener('click', () => {
  if (reviewWords) {
    if (cardIndex === reviewWords.length - 1) finishReview();
    else showCard(cardIndex + 1);
    return;
  }

  practice.index = cardIndex + 1;
  practice.answered = false;
  if (practice.index === practice.entries.length) finishPractice();
  else showCard(practice.index);
});

practiceAgainButton.addEventListener('click', () => {
  practice.index = 0;
  practice.answered = false;
  showCard(0);
});

revealButton.addEventListener('click', () => {
  meaning.hidden = false;
  revealButton.setAttribute('aria-expanded', 'true');
});

function leaveWordView() {
  card.hidden = true;
  if (!reviewWords && practice.onBack) {
    practice.onBack();
    return;
  }
  path.hidden = false;
  openButton.focus();
}

backButton.addEventListener('click', leaveWordView);
practiceSummaryBack.addEventListener('click', leaveWordView);

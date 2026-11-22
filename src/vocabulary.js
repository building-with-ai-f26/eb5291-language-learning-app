import { everydayWords } from './vocabulary-content.js';
import { openSentences } from './sentences.js';
import { shuffle } from './shuffle.js';

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
const startReviewButton = document.querySelector('#start-review');
const reviewProgress = document.querySelector('#review-progress');
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

let cardIndex = 0;
let answerRecorded = false;
let reviewWords = null;
let score = 0;
let practiceWords = everydayWords;
let choicePool = everydayWords;
let returnToTopic = null;

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

function answerChoices(entry) {
  const alternatives = shuffle(choicePool.filter((candidate) => candidate.english !== entry.english))
    .sort((first, second) => similarity(entry, second) - similarity(entry, first));
  const distinctMeanings = new Set(alternatives.map((candidate) => candidate.english));
  return shuffle([entry.english, ...[...distinctMeanings].slice(0, 2)]);
}

function showCard(index) {
  cardIndex = index;
  answerRecorded = false;

  const reviewing = reviewWords !== null;
  const words = reviewWords ?? practiceWords;
  const entry = words[cardIndex];
  const choices = answerChoices(entry);
  const lastCard = cardIndex === words.length - 1;

  question.hidden = false;
  reviewResult.hidden = true;
  reviewProgress.hidden = !reviewing && !returnToTopic;
  reviewProgress.textContent = reviewing
    ? `Question ${cardIndex + 1} of ${reviewLength}`
    : `Word ${cardIndex + 1} of ${words.length}`;
  word.textContent = entry.spanish;
  meaning.textContent = entry.english;
  meaning.hidden = true;
  revealButton.setAttribute('aria-expanded', 'false');
  feedback.textContent = '';
  feedback.removeAttribute('data-result');
  example.hidden = true;
  exampleSentence.textContent = entry.example.spanish;
  exampleMeaning.textContent = entry.example.english;
  revealButton.hidden = reviewing;
  nextButton.hidden = reviewing || lastCard;
  nextButton.textContent = reviewing ? 'Continue' : 'Next card';
  startReviewButton.hidden = reviewing || Boolean(returnToTopic);

  answerButtons.forEach((button, choiceIndex) => {
    button.textContent = choices[choiceIndex];
    button.removeAttribute('aria-disabled');
    button.removeAttribute('data-result');
  });
  word.focus();
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

export function openWords(entries, alternatives = everydayWords, onBack = null) {
  practiceWords = entries;
  choicePool = alternatives;
  returnToTopic = onBack;
  backButton.textContent = onBack ? 'Back to topic' : 'Back to learning path';
  path.hidden = true;
  card.hidden = false;
  reviewWords = null;
  title.textContent = onBack ? 'Practice words' : 'Everyday words';
  showCard(0);
}

openButton.addEventListener('click', () => openWords(everydayWords));

answerButtons.forEach((button) => {
  button.addEventListener('click', () => {
    if (answerRecorded) return;

    const reviewing = reviewWords !== null;
    const words = reviewWords ?? practiceWords;
    const entry = words[cardIndex];
    const correct = button.textContent === entry.english;
    const result = correct ? 'correct' : 'incorrect';
    answerButtons.forEach((choice) => choice.removeAttribute('data-result'));
    button.setAttribute('data-result', result);
    feedback.setAttribute('data-result', result);
    if (!reviewing && !correct) {
      feedback.textContent = 'Try again.';
      return;
    }

    answerRecorded = true;
    const translation = `${entry.spanish} means ${entry.english}.`;
    feedback.textContent = correct ? `Correct! ${translation}` : `Incorrect. ${translation}`;
    if (returnToTopic && cardIndex === words.length - 1) feedback.textContent += ' Practice complete.';
    example.hidden = !correct;
    answerButtons.forEach((choice) => choice.setAttribute('aria-disabled', 'true'));
    if (reviewing) {
      score += Number(correct);
      nextButton.hidden = false;
    }
  });
});

startReviewButton.addEventListener('click', startReview);
retryReviewButton.addEventListener('click', startReview);
practiceReviewWordsButton.addEventListener('click', () => openWords(everydayWords));
startLevelTwoButton.addEventListener('click', () => {
  if (unlockedLevel() !== 2) return;
  card.hidden = true;
  openSentences();
});
nextButton.addEventListener('click', () => {
  if (reviewWords && cardIndex === reviewWords.length - 1) {
    finishReview();
  } else {
    showCard(cardIndex + 1);
  }
});

revealButton.addEventListener('click', () => {
  meaning.hidden = false;
  revealButton.setAttribute('aria-expanded', 'true');
});

backButton.addEventListener('click', () => {
  card.hidden = true;
  if (returnToTopic) {
    returnToTopic();
    return;
  }
  path.hidden = false;
  openButton.focus();
});

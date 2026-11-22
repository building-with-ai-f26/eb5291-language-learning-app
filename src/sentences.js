import { sentenceRounds } from './sentence-content.js';
import { grammarRules } from './grammar-content.js';
import { createTileBuilder, matchesAnswer } from './tiles.js';

const path = document.querySelector('.path');
const openButton = document.querySelector('#level-two');
const lesson = document.querySelector('#sentence-lesson');
const progress = document.querySelector('#sentence-progress');
const prompt = document.querySelector('#sentence-prompt');
const availableTiles = document.querySelector('#available-tiles');
const selectedTiles = document.querySelector('#selected-tiles');
const feedback = document.querySelector('#sentence-feedback');
const checkButton = document.querySelector('#check-sentence');
const nextButton = document.querySelector('#next-sentence');
const replayButton = document.querySelector('#replay-sentence-round');
const nextRoundButton = document.querySelector('#next-sentence-round');
const backButton = document.querySelector('#back-from-sentences');
const tutorialButton = document.querySelector('#open-sentence-tutorial');
const grammarDetails = document.querySelector('#sentence-grammar');
const ruleContent = document.querySelector('#sentence-rule');
const builder = createTileBuilder(availableTiles, selectedTiles, checkButton, feedback);

let exerciseIndex = 0;
let rounds = sentenceRounds;
let roundIndex = 0;
let returnToTopic = null;

function showExercise(index) {
  exerciseIndex = index;
  const exercises = rounds[roundIndex];
  const exercise = exercises[index];
  progress.textContent = `Sentence ${index + 1} of ${exercises.length}`;
  prompt.textContent = exercise.prompt;
  feedback.textContent = '';
  checkButton.hidden = false;
  nextButton.hidden = true;
  replayButton.hidden = true;
  nextRoundButton.hidden = true;
  builder.reset(exercise.answer);
  const rule = grammarRules.get(exercise.grammarFocus);
  grammarDetails.open = false;
  grammarDetails.hidden = !rule;
  if (rule) {
    const title = document.createElement('h4');
    title.textContent = rule.title;
    const summary = document.createElement('p');
    summary.textContent = rule.summary;
    ruleContent.replaceChildren(title, summary);
  } else {
    ruleContent.replaceChildren();
  }
  prompt.focus();
}

export function openSentences(entries = null, onBack = null) {
  rounds = entries ? [entries] : sentenceRounds;
  roundIndex = 0;
  returnToTopic = onBack;
  tutorialButton.hidden = Boolean(onBack);
  backButton.textContent = onBack ? '← Topic' : '← Learning path';
  path.hidden = true;
  lesson.hidden = false;
  showExercise(0);
}

openButton.addEventListener('click', () => openSentences());

checkButton.addEventListener('click', () => {
  const exercises = rounds[roundIndex];
  const exercise = exercises[exerciseIndex];
  const selectedWords = builder.answer();
  const correct = exercise.acceptedAnswers.some((answer) => matchesAnswer(answer, selectedWords));
  if (!correct) {
    feedback.textContent = `Try again. ${exercise.hint}`;
    return;
  }

  const lastExercise = exerciseIndex === exercises.length - 1;
  const lastRound = roundIndex === rounds.length - 1;
  const completion = returnToTopic ? ' Practice complete.' : lastRound ? ' Lesson complete.' : ' Round complete.';
  feedback.textContent = `Correct! ${exercise.explanation}${lastExercise ? completion : ''}`;
  builder.lock();
  checkButton.hidden = true;
  nextButton.hidden = lastExercise;
  replayButton.hidden = !lastExercise;
  nextRoundButton.hidden = !lastExercise || lastRound;
  feedback.focus();
});

nextButton.addEventListener('click', () => showExercise(exerciseIndex + 1));
replayButton.addEventListener('click', () => showExercise(0));
nextRoundButton.addEventListener('click', () => {
  roundIndex += 1;
  showExercise(0);
});

backButton.addEventListener('click', () => {
  lesson.hidden = true;
  if (returnToTopic) {
    returnToTopic();
    return;
  }
  path.hidden = false;
  openButton.focus();
});

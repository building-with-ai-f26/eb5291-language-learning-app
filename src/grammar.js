import './best-friend.js';
import { describingThings, grammarExercises, grammarRoles, grammarRules } from './grammar-content.js';
import { createTileBuilder, matchesAnswer } from './tiles.js';
import { unlockedLevel } from './vocabulary.js';

const intro = document.querySelector('.intro');
const path = document.querySelector('.path');
const sentenceLesson = document.querySelector('#sentence-lesson');
const openGuide = document.querySelector('#open-grammar');
const openFromLesson = document.querySelector('#open-sentence-tutorial');
const guide = document.querySelector('#grammar-guide');
const guideTitle = document.querySelector('#grammar-title');
const replay = document.querySelector('#replay-tutorial');
const tutorial = document.querySelector('#grammar-tutorial');
const back = document.querySelector('#back-from-tutorial');
const progress = document.querySelector('#tutorial-progress');
const prompt = document.querySelector('#tutorial-prompt');
const comparison = document.querySelector('#tutorial-comparison');
const buildArea = document.querySelector('#tutorial-builder');
const feedback = document.querySelector('#tutorial-feedback');
const check = document.querySelector('#check-tutorial');
const next = document.querySelector('#next-tutorial');
const builder = createTileBuilder(document.querySelector('#tutorial-tiles'),
  document.querySelector('#tutorial-selected'), check, feedback);

let stepIndex = 0;
let fromLesson = false;
let hasStarted = false;

function textElement(tag, text) {
  const element = document.createElement(tag);
  element.textContent = text;
  return element;
}

for (const rule of grammarRules.values()) {
  const details = document.createElement('details');
  details.className = 'grammar-rule';
  const takeaways = document.createElement('ul');
  takeaways.append(...rule.takeaways.map((text) => textElement('li', text)));
  details.append(textElement('summary', rule.title), textElement('p', rule.summary), takeaways);
  document.querySelector('#grammar-rules').append(details);
}

function comparisonCard(example) {
  const card = document.createElement('div');
  card.className = 'grammar-comparison';
  const chunks = document.createElement('div');
  chunks.className = 'grammar-chunks';
  for (const part of example.parts) {
    const chunk = document.createElement('div');
    chunk.className = 'grammar-chunk';
    chunk.dataset.role = part.role;
    const word = textElement('strong', part.text);
    word.lang = 'es';
    chunk.append(word, textElement('small', grammarRoles[part.role]));
    chunks.append(chunk);
  }
  card.append(textElement('h4', example.english), chunks, textElement('p', example.explanation));
  return card;
}

function showStep(index) {
  stepIndex = index;
  const step = describingThings.steps[index];
  const comparing = step.type === 'compare';
  progress.textContent = `Step ${index + 1} of ${describingThings.steps.length}`;
  comparison.hidden = !comparing;
  buildArea.hidden = comparing;
  check.hidden = comparing;
  next.hidden = !comparing;
  next.textContent = 'Continue';
  feedback.textContent = '';
  if (comparing) {
    const rule = grammarRules.get(describingThings.ruleId);
    prompt.textContent = step.instruction;
    comparison.replaceChildren(...step.exampleIds.map((id) =>
      comparisonCard(rule.examples.find((example) => example.id === id))));
  } else {
    const exercise = grammarExercises.get(step.exerciseId);
    prompt.textContent = exercise.english;
    builder.reset(exercise.tileBank);
  }
  prompt.focus();
}

function openTutorial(launchedFromLesson) {
  if (unlockedLevel() < describingThings.level) return;
  fromLesson = launchedFromLesson;
  hasStarted = true;
  (fromLesson ? sentenceLesson : guide).hidden = true;
  back.textContent = fromLesson ? 'Back to Level 2' : 'Back to grammar guide';
  tutorial.hidden = false;
  showStep(0);
}

function closeTutorial() {
  tutorial.hidden = true;
  (fromLesson ? sentenceLesson : guide).hidden = false;
  replay.textContent = 'Replay Describing things tutorial';
  (fromLesson ? openFromLesson : replay).focus();
}

openGuide.addEventListener('click', () => {
  intro.hidden = true;
  path.hidden = true;
  const locked = unlockedLevel() < describingThings.level;
  replay.hidden = locked;
  document.querySelector('#open-best-friend').hidden = locked;
  document.querySelector('#tutorial-locked').hidden = !locked;
  if (hasStarted) replay.textContent = 'Replay Describing things tutorial';
  guide.hidden = false;
  guideTitle.focus();
});

document.querySelector('#back-from-grammar').addEventListener('click', () => {
  guide.hidden = true;
  intro.hidden = false;
  path.hidden = false;
  openGuide.focus();
});

openFromLesson.addEventListener('click', () => openTutorial(true));
replay.addEventListener('click', () => openTutorial(false));
back.addEventListener('click', closeTutorial);

check.addEventListener('click', () => {
  const exercise = grammarExercises.get(describingThings.steps[stepIndex].exerciseId);
  const selected = builder.answer();
  if (!exercise.acceptedAnswers.some((answer) => matchesAnswer(answer, selected))) {
    const mistake = exercise.mistakeFeedback.find(({ answer }) => matchesAnswer(answer, selected));
    feedback.textContent = `Try again. ${mistake?.feedback ?? exercise.hint}`;
    return;
  }
  const last = stepIndex === describingThings.steps.length - 1;
  feedback.textContent = `Correct! ${exercise.explanation}${last ? ' Tutorial complete.' : ''}`;
  builder.lock();
  check.hidden = true;
  next.hidden = false;
  next.textContent = last ? 'Finish tutorial' : 'Continue';
  feedback.focus();
});

next.addEventListener('click', () => {
  if (stepIndex + 1 === describingThings.steps.length) {
    closeTutorial();
  } else {
    showStep(stepIndex + 1);
  }
});

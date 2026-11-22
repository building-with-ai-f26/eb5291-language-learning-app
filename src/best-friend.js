import lessonContent from '../spanish-best-friend.json' with { type: 'json' };
import { describingThings, grammarRoles, grammarRules } from './grammar-content.js';
import { unlockedLevel } from './vocabulary.js';

const guide = document.querySelector('#grammar-guide');
const openButton = document.querySelector('#open-best-friend');
const lesson = document.querySelector('#best-friend-lesson');
const prompt = document.querySelector('#best-friend-prompt');
const examples = document.querySelector('#best-friend-examples');
const feedback = document.querySelector('#best-friend-feedback');
const nextButton = document.querySelector('#next-best-friend');
const replayButton = document.querySelector('#replay-best-friend');
const backButton = document.querySelector('#back-from-best-friend');

const [phrase, ...sentences] = lessonContent.examples;
const comparison = grammarRules.get(describingThings.ruleId).examples
  .find(({ id }) => id === lessonContent.comparisonExampleId);

function textElement(tag, text) {
  const element = document.createElement(tag);
  element.textContent = text;
  return element;
}

function exampleCard(example) {
  const card = document.createElement('article');
  card.className = 'grammar-comparison';
  const title = textElement('h4', example.spanish);
  title.lang = 'es';
  const translation = textElement('p', example.english);
  card.append(title, translation);
  return card;
}

function interactiveExample(example) {
  const card = document.createElement('article');
  card.className = 'grammar-comparison';
  const spanish = document.createElement('p');
  spanish.lang = 'es';
  const english = document.createElement('p');
  english.lang = 'en';
  spanish.className = english.className = 'best-friend-line';
  const explanation = document.createElement('p');
  explanation.className = 'best-friend-explanation';
  explanation.setAttribute('role', 'status');
  const buttons = [];

  for (const token of example.tokens) {
    if (!token.lexemeId) {
      spanish.append(token.text);
      english.append(token.text);
      continue;
    }
    const lexeme = lessonContent.lexicon[token.lexemeId];
    const pair = [];
    for (const [line, label] of [[spanish, token.text], [english, token.translation]]) {
      if (!label) continue;
      const button = textElement('button', label);
      button.type = 'button';
      button.className = 'grammar-chunk best-friend-word';
      button.dataset.role = lexeme.label.toLowerCase();
      button.setAttribute('aria-pressed', 'false');
      button.addEventListener('click', () => {
        for (const word of buttons) word.setAttribute('aria-pressed', String(pair.includes(word)));
        const labels = [lexeme.label, token.role].filter(Boolean).join(' · ');
        explanation.replaceChildren(textElement('strong', labels), ' ', token.note ?? lexeme.note);
      });
      if (line.hasChildNodes()) line.append(' ');
      line.append(button);
      pair.push(button);
      buttons.push(button);
    }
  }

  card.append(spanish, english, explanation);
  return card;
}

function comparisonCard() {
  const card = exampleCard(comparison);
  const chunks = document.createElement('div');
  chunks.className = 'grammar-chunks best-friend-words';
  for (const part of comparison.parts) {
    const chunk = document.createElement('div');
    chunk.className = 'grammar-chunk';
    chunk.dataset.role = part.role;
    const word = textElement('strong', part.text);
    word.lang = 'es';
    chunk.append(word, textElement('small', grammarRoles[part.role]));
    chunks.append(chunk);
  }
  card.append(chunks, textElement('p', comparison.explanation));
  return card;
}

function showPhrase() {
  prompt.textContent = 'Tap a word to see what it does';
  examples.replaceChildren(interactiveExample(phrase), comparisonCard());
  feedback.textContent = '';
  nextButton.hidden = false;
  replayButton.hidden = true;
  prompt.focus();
}

function showQuestion() {
  prompt.textContent = lessonContent.question;
  nextButton.hidden = true;
  const choices = [];
  const cards = sentences.map((sentence, index) => {
    const card = interactiveExample(sentence);
    const choice = textElement('button', `Choose sentence ${index + 1}`);
    choice.type = 'button';
    choice.className = 'vocabulary-button';
    choice.setAttribute('aria-pressed', 'false');
    choices.push(choice);
    choice.addEventListener('click', () => {
      for (const button of choices) button.setAttribute('aria-pressed', String(button === choice));
      const result = sentence.id === lessonContent.answerId ? 'Correct.' : 'It’s the first sentence.';
      feedback.textContent = `${result} ${lessonContent.answerExplanation}`;
      replayButton.hidden = false;
    });
    card.append(choice);
    return card;
  });
  examples.replaceChildren(...cards);
  prompt.focus();
}

openButton.addEventListener('click', () => {
  if (unlockedLevel() < describingThings.level) return;
  guide.hidden = true;
  lesson.hidden = false;
  showPhrase();
});
nextButton.addEventListener('click', showQuestion);
replayButton.addEventListener('click', showPhrase);
backButton.addEventListener('click', () => {
  lesson.hidden = true;
  guide.hidden = false;
  openButton.focus();
});

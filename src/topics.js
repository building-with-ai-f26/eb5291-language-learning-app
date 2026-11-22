import { sentenceBank, topicLabels } from './sentence-content.js';
import { openSentences } from './sentences.js';
import { shuffle } from './shuffle.js';
import { vocabulary } from './vocabulary-content.js';
import { openWords, unlockedLevel } from './vocabulary.js';

const path = document.querySelector('.path');
const openButton = document.querySelector('#open-topics');
const view = document.querySelector('#topic-practice');
const options = document.querySelector('#topic-options');
const material = document.querySelector('#topic-material');
const topicTitle = document.querySelector('#topic-title');
const emptyNotice = document.querySelector('#topic-locked');
const groups = document.querySelector('.topic-groups');
const wordList = document.querySelector('#topic-words');
const sentenceList = document.querySelector('#topic-sentences');
const practiceWords = document.querySelector('#practice-topic-words');
const practiceSentences = document.querySelector('#practice-topic-sentences');
const roundLength = 3;

let topicId;
let words = [];
let sentences = [];
let unlockedWords = [];

function renderList(list, entries, field, language) {
  const items = entries.map((entry) => {
    const item = document.createElement('li');
    item.lang = language;
    item.textContent = entry[field];
    return item;
  });
  if (!items.length) {
    const item = document.createElement('li');
    item.textContent = 'Unlocks in a later lesson';
    items.push(item);
  }
  list.replaceChildren(...items);
}

function showTopic(id) {
  topicId = id;
  const level = unlockedLevel();
  unlockedWords = vocabulary.filter((entry) => entry.level <= level);
  words = unlockedWords.filter((entry) => entry.contexts.includes(id));
  sentences = sentenceBank.filter((entry) => entry.level <= level && entry.contexts.includes(id));

  for (const option of options.children) {
    option.setAttribute('aria-pressed', String(option.dataset.context === id));
  }
  topicTitle.textContent = topicLabels[id];
  renderList(wordList, words, 'spanish', 'es');
  renderList(sentenceList, sentences, 'prompt', 'en');
  practiceWords.hidden = !words.length;
  practiceSentences.hidden = !sentences.length;
  const hasMaterial = Boolean(words.length || sentences.length);
  emptyNotice.hidden = hasMaterial;
  groups.hidden = !hasMaterial;
  material.hidden = false;
  topicTitle.focus();
}

for (const [id, label] of Object.entries(topicLabels)) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'vocabulary-button';
  button.dataset.context = id;
  button.textContent = label;
  button.setAttribute('aria-pressed', 'false');
  button.addEventListener('click', () => showTopic(id));
  options.append(button);
}

openButton.addEventListener('click', () => {
  path.hidden = true;
  view.hidden = false;
  if (topicId) {
    showTopic(topicId);
  } else {
    document.querySelector('#topics-title').focus();
  }
});

document.querySelector('#back-from-topics').addEventListener('click', () => {
  view.hidden = true;
  path.hidden = false;
  openButton.focus();
});

function returnToTopic() {
  view.hidden = false;
  showTopic(topicId);
}

practiceWords.addEventListener('click', () => {
  const choicePool = new Set(words.map(({ english }) => english)).size >= 3 ? words : unlockedWords;
  view.hidden = true;
  openWords(shuffle(words).slice(0, roundLength), choicePool, returnToTopic);
});

practiceSentences.addEventListener('click', () => {
  view.hidden = true;
  openSentences(shuffle(sentences).slice(0, roundLength), returnToTopic);
});

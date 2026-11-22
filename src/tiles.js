import { shuffle } from './shuffle.js';

export function createTileBuilder(available, selected, checkButton, feedback) {
  return {
    reset(words) {
      selected.replaceChildren();
      checkButton.disabled = true;
      available.replaceChildren(...shuffle(words).map((word) => {
        const tile = document.createElement('button');
        tile.type = 'button';
        tile.className = 'vocabulary-button';
        tile.textContent = word;
        tile.addEventListener('click', () => {
          const destination = tile.parentElement === available ? selected : available;
          destination.append(tile);
          tile.focus();
          checkButton.disabled = selected.childElementCount === 0;
          feedback.textContent = '';
        });
        return tile;
      }));
    },
    answer() {
      return Array.from(selected.children, (tile) => tile.textContent.toLowerCase());
    },
    lock() {
      for (const tile of [...selected.children, ...available.children]) tile.disabled = true;
    },
  };
}

export function matchesAnswer(answer, selected) {
  return answer.length === selected.length && answer.every((word, index) => word.toLowerCase() === selected[index]);
}

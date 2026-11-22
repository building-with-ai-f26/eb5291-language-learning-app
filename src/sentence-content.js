import dataset from '../spanish-sentences.json' with { type: 'json' };

export const topicLabels = dataset.contexts;
export const sentenceBank = dataset.exercises.map((entry) => {
  const [firstWord, ...remainingWords] = entry.acceptedAnswers[0];
  return {
    ...entry,
    prompt: entry.english,
    answer: [firstWord[0].toUpperCase() + firstWord.slice(1), ...remainingWords],
  };
});

const firstRound = sentenceBank
  .filter(({ level, lessonId }) => level === 2 && lessonId === 'first-sentences');
const additionalPractice = sentenceBank
  .filter(({ level, lessonId }) => level === 2 && lessonId === 'sentence-practice');

export const sentenceRounds = [firstRound];
const roundSize = 3;
for (let index = 0; index < additionalPractice.length; index += roundSize) {
  sentenceRounds.push(additionalPractice.slice(index, index + roundSize));
}

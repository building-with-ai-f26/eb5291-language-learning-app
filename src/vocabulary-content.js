import vocabulary from '../spanish-vocabulary-100.json' with { type: 'json' };

export { vocabulary };

const firstLessonIds = ['agua', 'cafe', 'te', 'pan', 'leche', 'quiero', 'tengo', 'gracias'];
const vocabularyById = new Map(vocabulary.map((entry) => [entry.id, entry]));

export const everydayWords = firstLessonIds.map((id) => vocabularyById.get(id));

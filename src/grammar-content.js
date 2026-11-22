import grammar from '../spanish-grammar.json' with { type: 'json' };

export const grammarRules = new Map(grammar.rules.map((rule) => [rule.id, rule]));
export const grammarRoles = grammar.roles;
export const describingThings = grammar.tutorials.find(({ id }) => id === 'describing-things');
export const grammarExercises = new Map(grammar.practiceExercises.map((exercise) => [exercise.id, exercise]));

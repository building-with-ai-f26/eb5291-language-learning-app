const audioOrigin = import.meta.env.VITE_LESSON_AUDIO_ORIGIN?.trim();
export const hasLessonAudio = import.meta.env.DEV || Boolean(audioOrigin);

export function createHearIt(cardId, text) {
  const control = document.createElement('div');
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'vocabulary-button';
  const status = document.createElement('div');
  status.setAttribute('role', 'status');
  let audio;

  function label(action) {
    button.textContent = action;
    button.setAttribute('aria-label', `${action}: ${text}`);
    if (action === 'Hear it') button.dataset.analyticsEvent = 'hear_it_clicked';
    else delete button.dataset.analyticsEvent;
  }

  label('Hear it');
  button.addEventListener('click', async () => {
    if (button.getAttribute('aria-disabled') === 'true') return;
    button.setAttribute('aria-disabled', 'true');
    status.textContent = 'Loading audio…';
    try {
      if (!audio) {
        const path = `/api/lesson-audio/${encodeURIComponent(cardId)}`;
        audio = new Audio();
        if (audioOrigin) audio.crossOrigin = 'anonymous';
        audio.src = audioOrigin ? new URL(path, audioOrigin).href : path;
      }
      audio.currentTime = 0;
      await audio.play();
      label('Hear it');
      status.textContent = '';
    } catch (error) {
      if (error.name === 'NotAllowedError') {
        label('Play audio');
        status.textContent = 'Tap Play audio to listen.';
      } else {
        audio = undefined;
        label('Hear it');
        status.textContent = 'Audio is unavailable right now. You can keep going.';
      }
    } finally {
      button.removeAttribute('aria-disabled');
    }
  });
  control.append(button, status);
  return control;
}

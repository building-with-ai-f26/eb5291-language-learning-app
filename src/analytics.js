import './analytics.css';

const panel = document.querySelector('[data-analytics-surface]');
const surface = panel.dataset.analyticsSurface;
const properties = { app: 'word_of_mouth', surface };
const clickEvent = surface === 'product_page' ? 'try_app_clicked' : 'hear_it_clicked';
const events = new Set(['$pageview', clickEvent]);
const consentKey = `word-of-mouth.analytics-consent.${surface}`;
const token = import.meta.env.VITE_POSTHOG_TOKEN?.trim();
const apiHost = import.meta.env.VITE_POSTHOG_API_HOST?.trim();
const fictionalUsername = 'Build 2 Demo';
const replayAvailable = surface === 'learner_app'
  && (import.meta.env.DEV || import.meta.env.VITE_POSTHOG_REPLAY_TEST === 'true');
const eventKeys = new Set(['token', 'distinct_id', '$device_id', '$session_id', '$window_id', '$process_person_profile']);
let consent;
let sdk;
let loading;
let replay = false;
let replayStatusTimer;

panel.className = 'analytics-panel';
panel.innerHTML = `
  <details>
    <summary>Privacy choices</summary>
    <p>Optional analytics counts visits and the main action on this page. Session replay is off unless you start a separate masked test.</p>
    <div class="analytics-actions">
      <button type="button" data-allow>Allow analytics</button>
      <button type="button" data-decline>Decline analytics</button>
    </div>
    <div data-replay hidden>
      <p>Inputs and page text are masked during this test.</p>
      <label><input type="checkbox" data-fictional> I’m using a fictional profile in this tab.</label>
      <div class="analytics-actions">
        <button type="button" data-start-replay>Start masked test replay</button>
        <button type="button" data-stop-replay hidden>Stop test replay</button>
      </div>
    </div>
    <p data-analytics-status role="status"></p>
  </details>`;

const allow = panel.querySelector('[data-allow]');
const decline = panel.querySelector('[data-decline]');
const status = panel.querySelector('[data-analytics-status]');
const testReplay = panel.querySelector('[data-replay]');
const fictional = panel.querySelector('[data-fictional]');
const startReplay = panel.querySelector('[data-start-replay]');
const stopReplay = panel.querySelector('[data-stop-replay]');

try {
  consent = localStorage.getItem(consentKey);
} catch {
  // The choice still applies to this page when storage is unavailable.
}

function saveConsent(choice) {
  consent = choice;
  try {
    localStorage.setItem(consentKey, choice);
  } catch {
    // The choice still applies to this page.
  }
}

function fictionalProfileActive() {
  return Boolean(document.querySelector('#learning-home:not([hidden]), #spanish-course:not([hidden])'))
    && document.querySelector('#learning-username')?.textContent === fictionalUsername;
}

function updateReplayControls() {
  const eligible = replayAvailable && consent === 'allowed' && sdk && fictionalProfileActive();
  testReplay.hidden = !eligible;
  if (!eligible && replay) {
    endReplay();
    status.textContent = 'Test replay stopped when you left the profile.';
  }
}

if (replayAvailable) {
  const observer = new MutationObserver(updateReplayControls);
  for (const selector of ['#learning-home', '#spanish-course']) {
    observer.observe(document.querySelector(selector), { attributes: true, attributeFilter: ['hidden'] });
  }
  observer.observe(document.querySelector('#learning-username'), { childList: true });
}

function filterEvent(event) {
  if (consent !== 'allowed') return null;
  if (event.event === '$snapshot' && replay) {
    return { ...event, properties: { ...event.properties, ...properties } };
  }
  if (!events.has(event.event)) return null;
  const safe = Object.fromEntries(Object.entries(event.properties).filter(([key]) => eventKeys.has(key)));
  return { event: event.event, uuid: event.uuid, timestamp: event.timestamp, properties: { ...safe, ...properties } };
}

function enableAnalytics() {
  if (!token || !apiHost || consent !== 'allowed') return;
  if (loading || sdk) return;
  status.textContent = 'Loading analytics…';
  loading = import('posthog-js').then(({ default: posthog }) => {
    if (consent !== 'allowed') return;
    sdk = posthog.init(token, {
      api_host: apiHost,
      persistence: 'memory',
      persistence_name: 'word_of_mouth',
      opt_out_capturing_cookie_prefix: 'wom_consent_',
      person_profiles: 'never',
      save_referrer: false,
      save_campaign_params: false,
      autocapture: false,
      capture_pageview: false,
      capture_pageleave: false,
      capture_exceptions: false,
      capture_performance: false,
      capture_heatmaps: false,
      rageclick: false,
      disable_surveys: true,
      disable_web_experiments: true,
      disable_conversations: true,
      disable_product_tours: true,
      advanced_disable_toolbar_metrics: true,
      advanced_disable_feature_flags: true,
      disable_session_recording: true,
      enable_recording_console_log: false,
      request_batching: false,
      session_recording: {
        maskAllInputs: true,
        maskTextSelector: '*',
        maskAllElementAttributes: true,
        recordHeaders: false,
        recordBody: false,
        recordCrossOriginIframes: false,
        recordCanvas: false,
        captureJsonLd: false,
        maskCapturedNetworkRequestFn: () => undefined,
      },
      before_send: filterEvent,
    });
    sdk.opt_in_capturing({ captureEventName: false });
    sdk.register(properties);
    sdk.capture('$pageview', properties);
    status.textContent = 'Analytics allowed. Replay is off.';
    updateReplayControls();
  }).catch(() => {
    status.textContent = 'Analytics could not load. You can still use this page.';
  }).finally(() => {
    loading = undefined;
  });
}

allow.disabled = !token || !apiHost;
if (allow.disabled) status.textContent = 'Analytics is not configured in this preview.';
else if (consent === 'declined') status.textContent = 'Analytics and replay are off.';
else if (consent === 'allowed') enableAnalytics();

allow.addEventListener('click', () => {
  if (consent === 'allowed' && sdk) return;
  saveConsent('allowed');
  if (sdk) {
    sdk.opt_in_capturing({ captureEventName: false });
    updateReplayControls();
    status.textContent = 'Analytics allowed. Replay is off.';
  } else enableAnalytics();
});

function endReplay() {
  clearTimeout(replayStatusTimer);
  if (replay) sdk.stopSessionRecording();
  replay = false;
  startReplay.hidden = false;
  stopReplay.hidden = true;
  fictional.checked = false;
}

decline.addEventListener('click', () => {
  endReplay();
  saveConsent('declined');
  sdk?.opt_out_capturing();
  testReplay.hidden = true;
  status.textContent = 'Analytics and replay are off.';
});

startReplay.addEventListener('click', () => {
  if (!replayAvailable || consent !== 'allowed' || !sdk || replay || !fictionalProfileActive()) return;
  if (!fictional.checked) {
    status.textContent = 'Confirm this is a fictional profile before starting replay.';
    return;
  }
  replay = true;
  sdk.startSessionRecording();
  startReplay.hidden = true;
  stopReplay.hidden = false;
  status.textContent = 'Masked test replay requested. Stop it when you finish testing.';
  replayStatusTimer = setTimeout(() => {
    if (replay && !sdk.sessionRecordingStarted()) {
      status.textContent = 'Replay hasn’t started. Check whether the project and browser allow recording.';
    }
  }, 8000);
});

stopReplay.addEventListener('click', () => {
  endReplay();
  status.textContent = 'Test replay stopped. Analytics is still allowed.';
});

document.addEventListener('click', (event) => {
  const control = event.target.closest?.(`[data-analytics-event="${clickEvent}"]`);
  if (!control || control.getAttribute('aria-disabled') === 'true' || consent !== 'allowed') return;
  sdk?.capture(clickEvent, properties, { transport: 'sendBeacon' });
}, true);

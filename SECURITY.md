# Word of Mouth security review

## Scope

- Course lane: Beginner. App type: AI app with no database.
- Pronunciation security review: source `45bc97f`, GitHub Pages artifact `f267e44`. Learner analytics release: source `032c563`, GitHub Pages artifact `6f7f12d`. The separate Product Page remains a local draft.
- GitHub Pages serves a static learner app. The learner profile and Level 2 unlock are stored in the learner’s browser. A Cloudflare Worker fetches pronunciation from OpenRouter. There are no cloud accounts, application database, or user file uploads.
- Database access controls, database backups, and private storage buckets are not applicable. The Worker caches generated audio for fixed lesson text.

## Checks completed before the live test

| Check | Result |
| --- | --- |
| Git and current working files | Scanned tracked and unignored working files and reachable local Git blobs for the requested credential markers, private-key headers, and exact matches to the private value configured in the ignored local environment. The only historical marker was an explicit placeholder in `.env.example`, which did not match the configured value. No real credential was found in the scanned files or history. The browser-facing PostHog project token is not a private key. |
| Public release artifact | Scanned the saved Pages artifact and available Pages history, including the current and older reachable JS and CSS files in the release. No credential marker or exact private-key match was found. Previous Chrome verification established that the public site served the release bundle. This audit did not re-fetch the public site before approval. |
| Production build | Built the checked-in source in a temporary directory with the public Worker URL and no PostHog values or private environment file. The generated HTML, JS, and CSS matched the saved Pages artifact byte for byte. |
| Dependency audit | `npm audit` reported zero known vulnerabilities for both the public release lockfile and the separate local draft lockfile. |
| Local Worker checks | Using a mocked provider, verified method and origin checks, rejection of unknown IDs and query input, required bindings, both rate-limit branches, cache reuse without another provider call, the exact free model and default voice, disabled paid fallback, provider 429 tagging, and graceful failure for invalid audio and timeout. |
| Worker secret | Prior Cloudflare deployment verification listed `OPENROUTER_API_KEY` as a `secret_text` binding. The browser bundle points to the public Worker URL and contains no private key. The Worker constructs the provider authorization header server-side. |
| Rate-limit configuration | The deployed configuration declares a visitor limit of 25 requests per 60 seconds and a separate generation limit of 12 cache misses per 60 seconds per Cloudflare location. The visitor check runs before the cache; the generation check runs only on a miss. These limits are approximate across edge locations. [Cloudflare rate limit documentation](https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/) |
| Provider spending cap | A read-only OpenRouter key metadata request returned HTTP 200. The configured key has a spending limit with no reset interval, so there is no verified monthly key cap. No account-wide monthly cap was verified. The free model and disabled fallback are independent safeguards. [OpenRouter current key API](https://openrouter.ai/docs/api/api-reference/api-keys/get-current-key) |

## Prior live evidence

- Chrome previously verified that **My learning → Spanish → Everyday words → speaker on agua** played to completion on the public app.
- Previous deployment checks observed HTTP 404 for an unknown lesson ID and HTTP 403 for a disallowed origin.
- The approved read-only live scan downloaded the public HTML and all four published JS and CSS assets. All five files returned HTTP 200 and matched `f267e44` byte for byte. The scan found no requested credential markers, private-key headers, or exact matches to the configured private key. No request went to the pronunciation Worker.
- After Emma uploaded the replacement OpenRouter secret, Cloudflare showed Worker version `8c6ffba6` serving 100% of traffic. Emma reported a $0 spending limit on the replacement key. At 21:26:39 UTC on November 22, 2026, one speaker tap on **gracias** in Chrome returned HTTP 200 with `audio/mpeg` and played to completion. The response reported `CF-Cache-Status: HIT` and `Age: 2681`, so this test did not verify fresh generation with the replacement key. That check stopped after one request. No 429 batch was run and no key or cap was changed.
- After Emma reported disabling the old key, a single Chrome speaker tap on **llegar** at 21:34:01 UTC on November 22, 2026 returned HTTP 200 with `audio/mpeg` and played to completion. The browser cache was disabled. Cloudflare metrics for 21:34:01–21:34:05 UTC recorded exactly one Worker invocation and one outbound fetch. The Worker fetches OpenRouter only on a cache miss, so this verifies fresh generation. OpenRouter Activity requires a signed-in session and the replacement key’s activity row has not been independently verified. No second pronunciation attempt was made and the $0 cap was left unchanged.
- The separate live visitor-limit check is recorded below.

## Findings and open items

- No new high-severity code finding was verified. This pass changed only this report.
- A value with the format of a likely real OpenRouter key appeared in earlier tool output while the local example file was being inspected. This was separate from the confirmed Git history placeholder. Emma reported that she disabled the old key. The replacement is deployed with an Emma-reported $0 spending limit. The Worker/browser check verified fresh generation after rotation. The OpenRouter Activity row is pending dashboard confirmation.
- Browser origin restrictions do not authenticate callers. Known lesson IDs, the two rate limits, cached responses, and the fixed free model bound the public route’s behavior. The provider check did not establish a monthly spend cap.
- Pending Build 3 evidence includes a classmate completing the core workflow on a phone, filtered PostHog screenshots, dashboard confirmation of live analytics, and a successful live masked replay.

## Live 429 test — completed

- On November 22, 2026, a preflight on `GET /api/lesson-audio/llegar` returned HTTP 200 with `CF-Cache-Status: HIT` and `Age: 654`. After 65 seconds without test traffic, one HTTPS client sent 30 sequential requests for that same clip from 21:46:02.206 to 21:46:03.907 UTC. All responses came from the EWR edge. There were no retries.
- Requests 1–26 returned HTTP 200 cache hits, all byte-identical to the preflight clip. Requests 27–30 returned HTTP 429 with `Cache-Control: no-store` and no `X-Speech-Status` header. The first 429 had Cloudflare Ray ID `a5eb1feeaa7942d2-EWR`. Cloudflare’s visitor limiter is approximate, so the observed first rejection was request 27 even though the configured threshold is 25.
- No response carried `X-Speech-Status: provider-429`, the Worker’s marker for an OpenRouter 429. Cloudflare metrics covering the batch recorded exactly 30 Worker invocations and zero outbound subrequests. Combined with the cache hits, this identifies the 429s as the Worker’s visitor limit and confirms the batch never called OpenRouter.
- Captured the observed HTTPS transcript and the local screenshot `word-of-mouth-build3-worker-429.png` for the assignment. The $0 cap, credentials, and settings were unchanged.

## Analytics release candidate — local verification

- The learner-only Pages build bundles the existing public PostHog project configuration and points to the existing pronunciation Worker. The candidate contains no Product Page draft, private OpenRouter key, or private key reference. The Worker, its secret, and the published Pages artifact are unchanged.
- The compiled candidate was exercised in Chrome against a local collector and a separate audio origin serving a captured **agua** MP3. Declining consent produced zero collector requests, including after reload. After opt-in, the collector received only `$pageview` and `hear_it_clicked`, tagged `app=word_of_mouth` and `surface=learner_app`. The audio played to completion.
- Replay stayed off until a separate opt-in on the active fictional **Build 2 Demo** profile. That name was entered manually. The app neither displayed it as an instruction nor prefilled it. Recorded payloads masked the fictional profile name, input, lesson text, and test attribute. Leaving the profile stopped the recording. No real learner profile was used.
- The shared project’s read-only SDK configuration returned HTTP 200 and included replay configuration at review time. No settings were changed. After an approved deployment, dashboard ingestion and a masked replay from the actual Pages origin still need confirmation.

## Learner analytics release — live verification

- GitHub Pages reported `6f7f12d` built and served the corresponding bundle at the existing public URL. The build from source `032c563` contained the existing public PostHog configuration and the Worker URL. It contained no OpenRouter key and did not include the Product Page draft.
- In an isolated Chrome session, declining analytics sent zero PostHog requests, including after reload. After opt-in, the browser sent a tagged `$pageview` with `app=word_of_mouth` and `surface=learner_app`. The event request returned HTTP 200. The POST following the speaker click returned HTTP 204. Its encoded body was not decoded in the live capture. The exact `hear_it_clicked` payload was verified with the local collector. PostHog dashboard ingestion remains to be checked.
- On the public app, the speaker on **agua** returned HTTP 200 with `audio/mpeg` and played to completion in Chrome.
- Replay controls stayed hidden before analytics consent and until the fictional profile name was entered manually. The separate opt-in was tested only with that fictional profile. Chrome observed HTTP 204 for the recorder script, the app reported that recording had not started, and no replay snapshot upload was observed. The public configuration advertised replay and a standalone read of the recorder asset returned HTTP 200, so the browser failure does not establish that a shared project setting needs changing. The local masking check passed. Live masking and replay ingestion remain unverified. The Worker and account settings were unchanged.

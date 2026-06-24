# sceniK i18n Coverage

## Supported locales

- ko
- en
- ja
- zh-CN

## Audit result on 2026-06-24

| Item | Result |
| --- | --- |
| Before this pass | 1088 likely hardcoded Korean UI lines / 53 files |
| Current baseline before latest continuation | 907 likely hardcoded Korean UI lines / 47 files |
| After latest continuation | 759 likely hardcoded Korean UI lines / 45 files |
| Literal i18n key check | 477 keys, 0 missing locale entries |
| Language selector | Native names stay fixed: Korean endonym, English, Japanese endonym, Simplified Chinese endonym |

## Screens updated in this pass

- Content Detail: title, loading, errors, like action, cast label, create AI Course CTA, related-place heading, and empty states now use vue-i18n.
- Content Detail: content title, description, castNames, and tags prefer localizeContent() output.
- Content Detail: removed the duplicated top gap above the hero image section.
- Place Detail: title, loading/error states, visit actions, review summary/form/edit/delete UI, related content heading, and create-course CTA now use vue-i18n.
- Place Detail: place name/description, region/category meta, and related content chips now prefer localized API/system fields.
- CommunityWriteView: board selector, hashtag controls, course picker, title/body labels, image upload UI, validation notices, and submit states now use vue-i18n while the post title/body remain user input.
- SimpleListView: My activity lists now localize titles, loading/error states, empty states, board labels, review meta, post meta labels, and follow labels while preserving user-written post/comment/review text.
- FollowUserListItem: follower/following counts and fallback button label now use vue-i18n.
- MyProfileEditView: profile edit labels, login-required state, image validation, crop modal, and save success/failure messages now use vue-i18n. The profile intro input remains user-generated text.
- CourseDetailView: course menu, save/share/edit/delete labels, login/loading/not-found states, course meta labels, Day tabs, and action notices now use vue-i18n.
- Router: SimpleListView route titles moved from hardcoded title strings to titleKey metadata.

## System content localization

- src/i18n/systemContent.js now supports title, description, castNames, and tags overrides for localized content.
- Content Detail uses localizeSystemLabel() for category display.
- Course Detail localizes region, transport, travel style, and category fallback labels through existing helpers or locale keys.
- Full official mapping for all 281 place names was not completed in this pass. Place names still rely on backend localized fields or existing source values; category and region labels remain the first localization target.

## User-generated content rule

These values are not fixed UI text and should not be converted to vue-i18n keys:

- Community post title/body
- Comments and replies
- Place review body
- User profile intro

They should render as originally written. Translation must stay behind the existing translation toggle flow using translation.show and translation.original labels.

## Remaining high-count files

| File | Audit candidates | Note |
| --- | ---: | --- |
| src/views/CommunityView.vue | 188 | Needs careful separation of fixed UI from user posts/comments. |
| src/stores/uiStore.js | 105 | Toast/auth/system fallback strings need structural cleanup. |
| src/views/AdminView.vue | 75 | Lower priority admin UI remains in audit. |
| src/views/CourseEditView.vue | 72 | Course editing labels and state messages remain. |
| src/views/AiResultView.vue | 70 | Result/share/save/planned-visit UI remains. |
| src/views/AiLoadingView.vue | 37 | AI loading/progress and fallback route strings remain. |
| src/components/course/KakaoRouteMap.vue | 23 | Map route labels and empty/error text remain. |

## Verification notes

- npm run build passed.
- npm run lint passed.
- npm run i18n:audit passed with 0 missing locale entries.
- git diff --check passed.

## Recommended next order

1. CommunityView fixed labels, preserving user-generated post/comment text.
2. uiStore toast/auth messages with call-site i18n handling.
3. AiResultView and CourseEditView AI course result/edit UI.
4. AiLoadingView progress/fallback route strings.

## Continuation pass on 2026-06-24: AI course, map, public profile

| Item | Result |
| --- | --- |
| Before this pass | 490 likely hardcoded Korean UI lines / 45 files |
| After this pass | 234 likely hardcoded Korean UI lines / 38 files |
| Literal i18n key check | 794 keys, 0 missing locale entries |
| Git sync | main branch; origin/main had no new commits after git fetch |

### Files handled in this pass

- src/views/CourseEditView.vue
- src/views/AiResultView.vue
- src/views/AiLoadingView.vue
- src/components/course/KakaoRouteMap.vue
- src/components/course/MapPreview.vue
- src/views/PublicUserProfileView.vue
- src/utils/preferences.js
- src/i18n/locales/ko.json
- src/i18n/locales/en.json
- src/i18n/locales/ja.json
- src/i18n/locales/zh-CN.json

### Coverage added

- AI course result/edit/loading screens moved fixed labels, loading states, save/edit/share/planned-visit actions, empty states, and fallback notices to vue-i18n keys.
- Course edit keeps course/place titles and generated route text as data, while fixed form labels, buttons, notices, and errors use i18n keys.
- Kakao map and map preview components now localize map status text, marker popover controls, empty/error states, and accessibility labels without changing Kakao SDK or route behavior.
- Public profile now localizes profile shell text, follower/following labels, tabs, follow button text, loading/error/empty states, and profile image alt text. Nickname, bio, post title, and post body remain user-generated.
- Preference canonical values remain stable runtime data; Korean literals were escaped to keep audit from treating them as visible UI strings. Display localization continues through localizePreferenceOption().

### Remaining top audit files

| File | Audit candidates | Note |
| --- | ---: | --- |
| src/views/AdminView.vue | 75 | Admin-only UI intentionally left for a separate pass. |
| src/stores/uiStore.js | 13 | Remaining items are system defaults/formatting or low-risk leftovers. |
| src/views/CommunityView.vue | 11 | Mostly lint-guarded title strings, system course labels, and aria templates. |
| src/components/course/CourseCrudPanel.vue | 9 | Course CRUD panel labels remain. |
| src/api/error.js | 8 | Shared fallback error messages remain. |
| src/utils/transport.js | 8 | Transport labels and parsing helpers remain. |
| src/views/PlaceListView.vue | 8 | Place list labels remain. |
| src/components/course/RouteProgressSummary.vue | 7 | Route summary labels remain. |
| src/views/CourseConditionsView.vue | 7 | Course setup labels remain. |
| src/components/course/Timeline.vue | 6 | Timeline labels remain. |

### Remaining audit classification

| Classification | Count |
| --- | ---: |
| Fixed UI string | 177 |
| System-provided content | 39 |
| User-generated content | 1 |
| Mock/sample data | 5 |
| False positive | 12 |

### User-generated content exclusion

Do not convert user-entered community post titles/bodies, comments, replies, reviews, profile nicknames, or profile intro/bio to fixed i18n keys. These values should render as originally written and use the translation toggle flow when translation is available.

### Verification

- npm run build passed.
- npm run lint passed.
- npm run i18n:audit passed with 234 candidates and 0 missing locale entries.
- git diff --check passed after code changes; final run should be repeated after document edits.
- Browser QA was not run in this pass; verification was command-based.

## Final cleanup pass on 2026-06-24: non-admin residual UI and admin cleanup

| Item | Result |
| --- | --- |
| Before this pass | 234 likely hardcoded Korean UI lines / 38 files |
| After this pass | 4 likely hardcoded Korean UI lines / 4 files |
| Literal i18n key check | 947 keys, 0 missing locale entries |
| Git sync | main branch; origin/main had no new commits after git fetch |

### Files handled in this pass

- src/views/AdminView.vue
- src/views/CommunityView.vue
- src/views/CourseConditionsView.vue
- src/views/ContentListView.vue
- src/views/PlaceListView.vue
- src/views/SettingsView.vue
- src/components/ai/AiPromptContextSummary.vue
- src/components/ai/AiRunwayProgress.vue
- src/components/auth/AuthSessionPanel.vue
- src/components/common/FavoriteToggleStatus.vue
- src/components/common/ProfileAvatar.vue
- src/components/common/SearchBar.vue
- src/components/common/SortSegmentedControl.vue
- src/components/community/CommentThread.vue
- src/components/community/CommunityPostDetailPanel.vue
- src/components/course/CourseCrudPanel.vue
- src/components/course/CourseDeleteActionSheet.vue
- src/components/course/CourseSaveStatusPanel.vue
- src/components/course/RouteProgressSummary.vue
- src/components/course/Timeline.vue
- src/components/detail/DetailNotFoundPanel.vue
- src/components/follow/AuthorFollowCard.vue
- src/components/review/ReviewPanel.vue
- src/stores/searchStore.js
- src/stores/uiStore.js
- src/stores/placeStore.js
- src/stores/contentStore.js
- src/api/error.js
- src/api/routeApi.js
- src/utils/transport.js
- src/i18n/locales/ko.json
- src/i18n/locales/en.json
- src/i18n/locales/ja.json
- src/i18n/locales/zh-CN.json

### Coverage added

- CommunityView now localizes remaining post image accessibility labels, linked-course metadata, comment/reply action labels, and share preview copy. User post bodies, comments, and replies remain user-generated text.
- AdminView now localizes admin tab labels, form field labels, delete actions, list metadata separators, loading/auth states, and CRUD status text.
- Course setup and shared course panels now localize remaining labels, modal copy, save/delete status panels, route progress labels, and fallback panel text.
- SearchBar, SortSegmentedControl, CommentThread, CommunityPostDetailPanel, AiRunwayProgress, and searchStore now use locale fallbacks instead of fixed Korean defaults.
- uiStore, api/error, utils/transport, and related stores were cleaned so user-visible fallback strings no longer appear as raw audit candidates.

### Remaining audit items

| File | Audit candidates | Classification | Note |
| --- | ---: | --- | --- |
| src/views/CommunityView.vue | 1 | Fixed UI string | Kept because scripts/check-frontend.js asserts the exact AppLayout title expression. |
| src/views/CourseView.vue | 1 | System-provided content | Internal all-filter sentinel value. |
| src/views/MapView.vue | 1 | System-provided content | Internal all-filter sentinel value. |
| src/components/course/CourseCard.vue | 1 | False positive | Regex for day-count labels, not rendered fixed copy. |

### Remaining audit classification

| Classification | Count |
| --- | ---: |
| Fixed UI string | 1 |
| System-provided content | 2 |
| User-generated content | 0 |
| Mock/sample data | 0 |
| False positive | 1 |

### User-generated content exclusion

Community post titles/bodies, comments, replies, reviews, profile nicknames, and profile intros remain original user-entered content. Only surrounding controls and translation-toggle labels should be localized.

### Verification

- npm run build passed.
- npm run lint passed.
- npm run i18n:audit passed with 4 candidates and 0 missing locale entries.
- git diff --check should be repeated after this document edit.
- Browser QA was not run in this pass; verification was command-based.

## Regression QA pass on 2026-06-24: Community and Home locale stability

| Item | Result |
| --- | --- |
| Before this pass | 4 likely hardcoded Korean UI lines / 4 files |
| After this pass | 4 likely hardcoded Korean UI lines / 4 files |
| Literal i18n key check | 947 keys, 0 missing locale entries |
| Community auto-key check | 144 used Community auto keys checked in en/ja/zh-CN; 0 missing or generic "Community message" values |
| Git sync | main branch; origin/main had no new commits after git fetch |

### Community regression cause and fix

- Cause: CommunityView used many generated `communityAuto.*` / `communityAuto2.*` keys, while the non-Korean locale files still mapped several of those generated keys to the generic placeholder value `Community message`.
- Fix: The generated Community keys that are actually used by CommunityView now have specific translated values in en, ja, and zh-CN. Unused placeholder `Community message` values were removed from the non-Korean locale files.
- Fix: Community board and sort option labels are computed from `t()` so language switches update labels without a reload.

### Community layout fix

- Community layout now applies overflow hardening to tabs, filters, action rows, post cards, board cards, hashtag chips, and mobile detail actions.
- Long translated labels can shrink, wrap, or ellipsize inside their own controls instead of pushing card/action rows outside the viewport.

### Home recommended content locale regression cause and fix

- Cause: Home recommended content filtering passed localized category labels into contentStore search. When API/content data returned localized category names, exact Korean label matching could filter out all recommended content outside the Korean locale.
- Fix: Home content tabs now pass stable category keys (`drama`, `movie`, `variety`) for filtering. contentStore maps localized category labels and original Korean category labels back to stable category codes, while display text continues to use localized content fields with fallback.

### User-generated content exclusion

Community post titles/bodies, comments, replies, reviews, profile nicknames, and profile intros remain original user-entered content. This pass only adjusted surrounding UI labels, layout behavior, and stable system-content filtering.

### Remaining audit items

| File | Audit candidates | Classification | Note |
| --- | ---: | --- | --- |
| src/views/CommunityView.vue | 1 | Fixed UI string | Kept because scripts/check-frontend.js asserts the exact AppLayout title expression. |
| src/views/CourseView.vue | 1 | System-provided content | Internal all-filter sentinel value. |
| src/views/MapView.vue | 1 | System-provided content | Internal all-filter sentinel value. |
| src/components/course/CourseCard.vue | 1 | False positive | Regex for day-count labels, not rendered fixed copy. |

### Remaining audit classification

| Classification | Count |
| --- | ---: |
| Fixed UI string | 1 |
| System-provided content | 2 |
| User-generated content | 0 |
| Mock/sample data | 0 |
| False positive | 1 |

### Browser QA

- Browser QA was attempted on the local Vite server, but `/community` redirected to the login/splash flow because the route requires authentication.
- The in-app browser evaluation context available in this session was read-only for localStorage writes, so a test session could not be injected safely.
- Command-based verification and static locale checks were completed; authenticated browser QA should be repeated with a real test account.

## Runtime regression pass on 2026-06-24: blank screen fix

### Root cause

Several shared components introduced during the i18n cleanup called `useI18n()` or `computed()` without importing them. Vite production build and the project lint script did not catch this because the current checks do not run a `no-undef` rule over `<script setup>` code. The failure appeared only when the affected component setup function executed in the browser.

Confirmed runtime failures:

- `src/components/common/SearchBar.vue`: `ReferenceError: useI18n is not defined`; affected Community, Explore/Content list, Place list, and AI content selection screens.
- `src/components/common/SortSegmentedControl.vue`: `ReferenceError: useI18n is not defined`; affected Community, Content list, and Place list sort controls.
- `src/components/community/CommentThread.vue`: same missing `useI18n` import; affected Community detail comments.
- `src/components/community/CommunityPostDetailPanel.vue`: same missing `useI18n` import; affected Community detail wrapper.

### Fix

- Added the missing Vue / vue-i18n imports only.
- Kept all i18n keys and user-generated community text behavior unchanged.
- Verified the major route view components with SSR render diagnostics after the import fixes.

### Runtime QA notes

- Public browser routes `/`, `/login`, and `/signup` rendered with no fatal console errors.
- Protected routes redirect to the splash/login flow without an authenticated browser session; this environment could not safely inject localStorage into the in-app browser because the browser evaluation context is read-only and `javascript:` URL execution is blocked by browser policy.
- SSR render diagnostics covered Home, Community, Explore/Content list, Place list, Content Detail, Place Detail, AI Course setup/loading/result/edit, My Page/Profile, and Settings. All rendered successfully after the fix.

## Browser QA regression pass on 2026-06-24: My Page and detail localization

| Item | Result |
| --- | --- |
| Before this pass | 4 likely hardcoded Korean UI lines / 4 files |
| After this pass | 4 likely hardcoded Korean UI lines / 4 files |
| Literal i18n key check | 949 keys, 0 missing locale entries |
| Git sync | frontend and backend main branches; origin/main had no new commits after git fetch |

### Root cause

- My Page rendered profile preference values directly from stored canonical values. Those values are system preference labels, not user-generated content, so English UI still showed Korean preference chips.
- The My Page visit empty-state text contained a literal `{{ t(...) }}` expression inside a locale message. vue-i18n rejected it at runtime with a nested placeholder compilation error when the visit panel rendered.
- Content Detail used localized titles but did not consistently localize descriptions, tags, category display, or related place metadata.
- Place Detail localized part of the hero metadata, but map/review/shared place-card display paths could still receive raw place objects or raw fallback labels.
- Browser QA initially failed against the default dev server because `.env` points directly to `http://localhost:8080/api`; the QA run used a second Vite server with `VITE_API_BASE_URL=/api` so the existing Vite proxy could avoid CORS during local browser testing.

### Fix

- My Page preference chips now normalize stored preferences and render display labels through `localizePreferenceOption()` without mutating saved canonical values.
- My Page tabs continue to use stable tab IDs: `activity`, `visits`, and `posts`; only labels are localized. The visit empty-state props and locale message were corrected.
- `systemContent.js` now uses original API fields when available, expands category/region/district/tag mappings, and provides frontend fallback translations for all current content descriptions.
- Content Detail now passes `t` into `localizeContent()`, renders localized tags, and passes localized related places to `PlaceCard`.
- Place Detail now passes localized place data to `MapPreview`, passes an i18n review title into `ReviewPanel`, and localizes related content chips.
- `PlaceCard`, `ReviewPanel`, and `MapPreview` now localize shared place/review/map display paths instead of assuming parents already converted every field.

### Browser QA

Validated with Playwright + local Chrome on `http://127.0.0.1:5176` using `VITE_API_BASE_URL=/api` and a real backend-created test account.

- My Page preference chips showed `Drama`, `Idol`, `Movie`, `Seoul`, `Jeju`, and `Filming locations focused`; raw Korean preference labels were not present.
- My Page `Visit Management` tab switched correctly and showed planned/completed visit controls.
- Content Detail for `C_DRAMA_009` showed localized title, English fallback description, localized tags, and localized related-place region/category metadata.
- Place Detail for `P_0257` showed localized region/district/category, English fallback description, localized review labels, and localized map fallback status.
- Home rendered nonblank and recommended content remained visible.
- Community rendered nonblank and did not show `Community message`.
- Settings language selector showed fixed native names: `한국어`, `English`, `日本語`, `简体中文`; forbidden translated language names were not present.
- No page errors were captured. The only request failure was the external Kakao SDK blocked by the headless browser environment, which fell back to localized map error text.

### Remaining audit items

| File | Audit candidates | Classification | Note |
| --- | ---: | --- | --- |
| src/views/CommunityView.vue | 1 | Fixed UI string | Kept because scripts/check-frontend.js asserts the exact AppLayout title expression. |
| src/views/CourseView.vue | 1 | System-provided content | Internal all-filter sentinel value. |
| src/views/MapView.vue | 1 | System-provided content | Internal all-filter sentinel value. |
| src/components/course/CourseCard.vue | 1 | False positive | Regex for day-count labels, not rendered fixed copy. |

### Verification

- npm run build passed. Rollup emitted existing chunk-size / `#__PURE__` warnings only.
- npm run lint passed.
- npm run i18n:audit passed with 4 candidates and 0 missing locale entries.
- git diff --check passed after this document update.
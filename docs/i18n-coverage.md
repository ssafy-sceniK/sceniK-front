# sceniK i18n Coverage

## Supported Locales

- ko
- en
- ja
- zh-CN

## Frontend Foundation

- Vue i18n is initialized in `src/i18n/index.js`.
- The selected locale is stored in `localStorage` under `scenik-locale`.
- Settings writes the selected language to `/api/users/me` when the user is logged in.

## Localized UI Areas

- Global top navigation aria labels
- Bottom navigation labels
- Settings language, theme, notification, account, and session labels
- Content card known title/category labels
- Place card region/category labels
- User-generated community post, comment, reply, and review translation controls

## System Content Coverage

Official or commonly known K-content titles are localized only where the project has a verified mapping in `src/i18n/systemContent.js`.
Unmapped content and place names intentionally fall back to Korean.

## User-Generated Content

Community posts, comments, replies, reviews, and profile bios are treated as user-generated content.
The frontend displays source text by default and calls `/api/translations` only when the user taps the translation control.
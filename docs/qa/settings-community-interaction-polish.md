# 설정 및 커뮤니티 상호작용 UX 개선 QA

## 변경 목적

- 설정 화면의 계정 액션 행을 같은 카드 시스템 안에서 일관되게 보이도록 정리했다.
- 로그인/로그아웃/팔로우 성공 피드백이 하단 내비게이션에 묻히지 않도록 전역 toast를 상단 플로팅 형태로 개선했다.
- 커뮤니티 댓글의 답글/수정/삭제 액션을 느슨한 텍스트가 아니라 작은 액션 버튼처럼 보이게 했다.
- `parentCommentId` 기반 1단계 답글을 최상위 댓글 아래에 nested thread로 표시했다.
- 댓글과 답글의 좋아요를 실제 backend state/API에 연결하고 pending 중 중복 클릭을 막았다.
- 커뮤니티 `최신순 / 인기순` 정렬 UI를 더 compact한 세그먼트 컨트롤로 낮은 시각 무게로 정리했다.
- 커뮤니티 글 목록과 상세에서 작성자 팔로우/언팔로우 affordance를 명확히 노출했다.

## 설정/로그아웃 UI 변경 전 문제

- `로그아웃` 행이 주변 설정 행과 다른 작은 링크처럼 보여 계정 액션으로서의 터치 영역과 위계가 약했다.
- `프로필 / 취향 수정`, `로그인`, `로그아웃`이 같은 카드 안에 있어도 row affordance가 일정하지 않았다.

## Toast/feedback UI 개선 방식

- `uiStore.notify(message, tone)` 형태로 tone을 선택적으로 받을 수 있게 하고 기존 `toast` 문자열 계약은 유지했다.
- `App.vue`의 toast에 `role="status"`와 `aria-live="polite"`를 추가했다.
- toast를 하단이 아니라 `top-nav` 아래 상단 플로팅 위치로 이동해 bottom navigation, FAB와 겹치지 않게 했다.
- success/info/warning/error 점 색상 variant를 지원하되, 기존 호출은 그대로 동작한다.

## 커뮤니티 댓글/답글 UI 변경 전 문제

- `답글`이 느슨한 텍스트 버튼처럼 보여 댓글 액션 행의 의도가 약했다.
- 답글 댓글이 최상위 댓글과 같은 평면 list에 섞여 있어 부모/자식 관계가 명확하지 않았다.
- 이전에는 backend/frontend API에 댓글 좋아요 endpoint가 없어, 댓글 좋아요 토글 UI를 fake로 추가할 수 없었다.

## 커뮤니티 댓글/답글 UI 개선 방식

- 최상위 댓글은 `topLevelComments`, 답글은 `repliesFor(comment)`로 분리해 표시한다.
- 답글은 부모 댓글 아래 `reply-thread`로 렌더링하고 왼쪽 guide line, 들여쓰기, 작은 avatar로 구분한다.
- 답글/수정/삭제/저장/취소는 `comment-action-button` 계열의 작은 pill 버튼으로 통일했다.
- 답글 입력 form은 대상 댓글 바로 아래에 나타난다.
- backend가 지원하는 1단계 답글 model은 유지하되, 답글에서 다시 답글을 누르면 같은 최상위 댓글 thread 아래에 추가한다.

## 커뮤니티 댓글 좋아요 구현 범위

- 댓글 좋아요 API는 `POST /api/posts/comments/{commentId}/likes`, 좋아요 취소는 `DELETE /api/posts/comments/{commentId}/likes`를 사용한다.
- 댓글 목록과 게시글 상세 응답의 각 댓글은 `likeCount`, `likes`, `likedByMe`, `isLiked`를 화면에서 사용할 수 있도록 정규화한다.
- 최상위 댓글과 `parentCommentId`를 가진 1단계 답글 모두 같은 compact like button을 렌더링한다.
- 버튼은 `aria-pressed`로 현재 좋아요 상태를 전달하고, `♥/♡` 아이콘과 숫자 count를 함께 보여 색상만으로 상태를 판단하지 않게 했다.
- `pendingCommentLikes`에 요청 중인 `commentId`를 저장해 같은 댓글을 빠르게 두 번 눌러도 count가 꼬이지 않도록 했다.
- 비로그인 상태에서는 `로그인이 필요합니다.` 메시지를 기존 auth-required 흐름으로 전달하고 API를 호출하지 않는다.
- backend 응답이 있으면 응답의 count/state를 source of truth로 사용하고, 응답 body가 없는 edge case에는 안전하게 0 미만으로 내려가지 않는 fallback count만 적용한다.
- 오류가 발생하면 raw backend error를 그대로 노출하지 않고 `댓글 좋아요를 변경하지 못했습니다.`로 안내한다.

## 답글 상호작용 polish

- 답글 header의 visible `답글` metadata label을 제거하고, 최상위 댓글과 같은 `작성자 + 작성일` 구조로 표시한다.
- 답글 여부는 텍스트 라벨이 아니라 indentation, 왼쪽 guide line, 더 가벼운 border/background로 전달한다.
- 댓글 action button은 28px 높이, 더 작은 padding, 더 약한 border/background로 낮춰 secondary inline action처럼 보이게 했다.
- 답글에도 `답글` action을 노출한다.
- backend가 `Nested replies are not supported.`로 2단계 저장을 막기 때문에, 답글에서 다시 답글을 작성하면 `parentCommentId`를 원래 최상위 댓글 id로 보낸다.
- 화면은 계속 1단계 reply thread만 렌더링하며, 세 번째 depth UI는 만들지 않는다.
- 답글의 답글 입력창은 해당 답글 아래에 표시하고, placeholder는 대상 작성자 이름을 사용한다.
- 댓글/답글의 좋아요, 수정, 삭제 action은 기존 handler를 유지한다.

## 댓글/답글 시간 표시와 heart action polish

- 댓글과 답글의 시간 표시는 `createdAt`을 우선 사용한다.
- 생성 후 10초 미만은 `방금 전`으로 표시한다.
- 60초 미만은 `n초 전`, 60분 미만은 `n분 전`, 24시간 미만은 `n시간 전`으로 표시한다.
- 24시간 이후에는 기존 앱에서 쓰는 `YYYY-MM-DD` 날짜 표시로 전환한다.
- 날짜 값이 없거나 invalid date이면 안전하게 `방금 전` 또는 기존 `date` fallback을 사용한다.
- 좋아요는 action row의 큰 pill 버튼에서 comment header 오른쪽의 compact heart button으로 이동했다.
- 좋아요 count는 0보다 클 때만 heart 옆의 작은 muted text로 표시해 시각 무게를 낮췄다.
- `답글`, `수정`, `삭제`는 하단 secondary text/chip action으로 유지하고 padding, border, background 강도를 줄였다.
- `aria-pressed`, pending disabled, edit/delete ownership logic, reply-to-reply parent mapping은 유지했다.

## 커뮤니티 정렬 UI compact 개선 방식

- `SortSegmentedControl.vue`는 유지하되 `community-sort-row`의 card-like 배경/테두리/그림자를 제거했다.
- 세그먼트 컨트롤은 full-width가 아니라 콘텐츠 기반 auto-width로 줄였다.
- 결과 수는 오른쪽의 조용한 보조 텍스트로 유지했다.
- native `<select>`는 다시 도입하지 않았다.

## 팔로우/언팔로우 노출 방식

- 커뮤니티 상세의 작성자 행과 커뮤니티 목록 카드 작성자 행에 `팔로우 / 팔로잉` 버튼을 노출했다.
- 이미 팔로우한 작성자는 `팔로잉` active 상태로 표시한다.
- 현재 사용자의 own post는 follow button을 숨긴다.
- 비로그인 상태에서 다른 작성자의 버튼을 누르면 기존 `requireAuth` 흐름으로 로그인 필요 메시지를 띄운다.
- follow 상태는 기존 `GET /api/users/me/following` 기반 `followingIds`에서 파생한다.
- backend follow API는 이미 존재하므로 backend 변경은 하지 않았다.

## 접근성 고려사항

- toast는 `role="status"`와 `aria-live="polite"`를 사용한다.
- 설정 계정 action은 `RouterLink` 또는 `button`으로 유지되어 keyboard 접근이 가능하다.
- 정렬 컨트롤은 기존 `radiogroup/radio` 구조와 방향키 전환을 유지한다.
- 댓글 액션과 팔로우 버튼은 native button이며 focus-visible outline을 제공한다.
- 팔로우 버튼은 `aria-pressed`로 현재 상태를 전달하고 pending 중에는 disabled 처리한다.

## 회귀 방지 확인 항목

- header logo는 `src/assets/brand/scenik_single_wordmark_blue.png` PNG 렌더링을 유지한다.
- inline SVG logo를 다시 도입하지 않았다.
- 커뮤니티 검색, 정렬, 탭, 더보기, 게시글 카드, 상세 댓글 흐름은 유지한다.
- 댓글 작성/수정/삭제/답글 API 호출 경로는 기존 `uiStore` action을 그대로 사용한다.
- 팔로우/언팔로우는 기존 `followApi.js`와 `uiStore.followUser`, `uiStore.unfollowUser`를 사용한다.
- 리뷰, AI 조건/추천 이유 패널, route save, 좋아요 pending UX, profile/logout visibility 관련 파일은 변경하지 않았다.

## QA 결과

| 항목 | 결과 | 비고 |
| --- | --- | --- |
| `npm run lint` | 통과 | 구조/금지 stack 검사 통과 |
| `npm run build` | 통과 | Vite chunk size 경고는 기존 번들 크기 경고 |
| `npm run smoke:course` | 통과 | 코스 smoke 확인 |
| `npm run smoke:errors` | 통과 | 에러 처리 smoke 확인 |
| `git diff --check` | 통과 | CRLF 변환 경고만 표시 |
| 프론트 직접 AI 호출 검사 | 통과 | `sceniK-ai`, `localhost:8000`, `127.0.0.1:8000` 직접 호출 없음 |
| 비밀 키 패턴 검사 | 통과 | 명백한 API key/private key 패턴 없음 |
| 커뮤니티 native sort select 검사 | 통과 | `CommunityView.vue`의 sort용 `<select>` 없음 |
| inline SVG logo 회귀 검사 | 통과 | `BrandLogo.vue`는 PNG logo 사용 유지 |
| backend 변경 여부 | 변경 있음 | 댓글 좋아요용 `comment_likes`와 `POST/DELETE /api/posts/comments/{commentId}/likes` 추가 |

## 남은 한계

- 댓글 좋아요는 backend endpoint와 연결된 실제 UI로만 노출한다. live server 기반 클릭 QA는 수동 확인이 필요하다.
- Windows 환경에서 이전 브라우저 캡처용 Vite 숨김 프로세스 기동 중 `액세스가 거부되었습니다.` 오류가 발생해 자동 브라우저 캡처 QA는 완료하지 못했다.
- 실제 화면 확인이 필요하면 아래 명령으로 수동 실행 후 `/settings`, `/community`, `/community/post/{id}`를 확인한다.

```powershell
npm run dev
```

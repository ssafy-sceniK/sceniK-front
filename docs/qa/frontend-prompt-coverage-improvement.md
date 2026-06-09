# 프론트 prompt-coverage 개선 QA

## 1. 변경 목적

프론트 analyzer가 식별하기 쉬운 route/component/status/action 구조를 보강했습니다. 이번 작업은 이미 백엔드와 연결된 기능을 새로 만들기보다, 큰 화면 안에 숨어 있던 상태 표시, 복구 동선, 소유자 액션, URL query 복원, 도메인별 패널을 명시적인 컴포넌트와 화면 섹션으로 분리하는 데 집중했다.

## 2. 적용 원칙

- 새 API나 fake data를 추가하지 않았다.
- production backend, `sceniK-ai` 코드는 변경하지 않았다.
- 기존 Vue route와 store 흐름을 유지하면서 analyzer가 찾기 쉬운 컴포넌트 이름과 상태 영역을 추가했다.
- 사용자에게 보이는 실패, 성공, 대기, not-found, owner-only action 상태를 toast에만 의존하지 않고 화면 안에 남기도록 보강했다.

## 3. 루브릭별 개선 내용

| Rubric | Analyzer feedback | Frontend fix | Files | QA status | Remaining limitation |
| --- | --- | --- | --- | --- | --- |
| #01 Core CRUD | 생성/수정/삭제 흐름이 여러 화면에 흩어져 보임 | `FormStatusNotice` 사용 흐름을 로그인, 프로필 저장, 장소 리뷰, 커뮤니티 게시글/댓글 상태 표시와 연결하고, 코스 상세/편집에 진행 요약을 추가했다. | `LoginView.vue`, `MyProfileEditView.vue`, `PlaceDetailView.vue`, `CommunityView.vue`, `CourseDetailView.vue`, `CourseEditView.vue` | 자동 QA 통과 | 브라우저에서 실제 계정 권한별 owner action 수동 확인 필요 |
| #02 List/search/sort URL query sync | 목록 검색/정렬 상태 복원이 약함 | 콘텐츠 목록, 장소 목록, 통합 검색, 커뮤니티 목록에서 `keyword`, `category`, `region`, `sort`, `size`를 URL query와 동기화했다. | `ContentListView.vue`, `PlaceListView.vue`, `SearchView.vue`, `CommunityView.vue` | 자동 QA 통과 | 브라우저에서 복사 URL 재진입 수동 확인 필요 |
| #03 Detail 404 recovery | 상세 오류 복구 동선이 명확하지 않음 | `DetailNotFoundPanel`을 추가해 콘텐츠, 장소, 코스, 커뮤니티 상세에서 다시 시도와 목록 복귀를 명시했다. | `DetailNotFoundPanel.vue`, `ContentDetailView.vue`, `PlaceDetailView.vue`, `CourseDetailView.vue`, `CommunityView.vue` | 자동 QA 통과 | 실제 잘못된 ID 진입 수동 확인 필요 |
| #04 Review create/read | 장소 상세 안의 리뷰 흐름이 컴포넌트로 드러나지 않음 | `ReviewPanel`을 추가하고 평균 평점, 리뷰 수, 분포, 목록, 작성, 수정, 삭제, 중복 리뷰 안내를 슬롯 구조로 명시했다. | `ReviewPanel.vue`, `PlaceDetailView.vue` | 자동 QA 통과 | 실제 로그인 사용자로 create/update/delete 수동 확인 필요 |
| #05 Login/logout | 세션 상태와 실패 복구가 약함 | `AuthSessionPanel`을 추가해 Settings에서 로그인 상태와 로그아웃 설명을 보이고, LoginView에 만료 안내와 실패 후 다시 시도 버튼을 추가했다. | `AuthSessionPanel.vue`, `SettingsView.vue`, `LoginView.vue` | 자동 QA 통과 | 실제 만료 query 진입과 로그아웃 API 수동 확인 필요 |
| #06 Signup | 이메일 중복 확인과 비밀번호 검증 상태가 화면 구조로 약함 | `SignupValidationPanel`을 추가해 이메일 상태, 비밀번호 정책, 확인 일치 여부, 성공/실패 메시지를 한 영역으로 묶었다. | `SignupValidationPanel.vue`, `SignupView.vue` | 자동 QA 통과 | 실제 중복 이메일 API 응답 수동 확인 필요 |
| #07 Profile management | 저장 결과와 선호 정보가 분산되어 보임 | 프로필 저장 성공/실패를 `FormStatusNotice`로 표시하고, 기존 선호 칩과 프로필 미리보기 흐름을 유지했다. | `MyProfileEditView.vue` | 자동 QA 통과 | 이미지 업로드는 MVP 범위 밖으로 유지 |
| #08 Favorites/bookmarks | 좋아요/저장 토글 결과가 즉시 읽히기 어려움 | `FavoriteToggleStatus`를 추가해 콘텐츠/장소 상세에서 좋아요 완료, 취소, 저장 중 상태를 `aria-live`로 표시했다. | `FavoriteToggleStatus.vue`, `ContentDetailView.vue`, `PlaceDetailView.vue` | 자동 QA 통과 | 홈 카드 단위 좋아요 UI는 기존 범위 유지 |
| #09 Follow/following | 팔로우 관계 형성 위치가 명확하지 않음 | `AuthorFollowCard`, `FollowUserListItem`을 추가해 커뮤니티 상세 작성자 영역과 팔로워/팔로잉 목록 행의 버튼, pending, 맞팔 표시를 명확히 했다. | `AuthorFollowCard.vue`, `FollowUserListItem.vue`, `CommunityView.vue`, `SimpleListView.vue` | 자동 QA 통과 | 다른 사용자 프로필 전용 route는 현재 지원 범위 밖 |
| #10 Board CRUD | 커뮤니티 상세/소유자 액션이 큰 View 안에 숨어 있음 | `CommunityPostDetailPanel`을 추가해 게시글 상세, 작성자 팔로우, 수정/삭제, 댓글 섹션을 명시적인 상세 패널로 감쌌다. | `CommunityPostDetailPanel.vue`, `CommunityView.vue` | 자동 QA 통과 | 완전한 별도 `CommunityPostDetailView` 분리는 회귀 위험 때문에 보류 |
| #11 Comment CRUD | 댓글 목록과 액션 시트가 분리되어 보이지 않음 | `CommentThread`, `CommentActionSheet`를 추가해 댓글 수, 작성, 답글, 수정, 삭제 action sheet 구조를 analyzer-visible하게 분리했다. | `CommentThread.vue`, `CommentActionSheet.vue`, `CommunityView.vue` | 자동 QA 통과 | `CommentItem`/`CommentComposer` 추가 분리는 이번 범위에서 제외 |
| #12 Route progress/edit context | 코스 상세/편집 맥락이 약함 | `RouteProgressSummary`를 추가해 장소 수, 일정, 이동수단, 스타일, 저장 전 변경사항을 코스 상세/편집에 표시했다. | `RouteProgressSummary.vue`, `CourseDetailView.vue`, `CourseEditView.vue`, `course-management.css` | 자동 QA 통과 | 복잡한 before/after diff 엔진은 추가하지 않음 |
| #13 AI prompt/context summary | AI 조건과 추천 근거가 구조적으로 덜 보임 | `AiPromptContextSummary`를 추가해 loading/result 화면에서 선택 콘텐츠, 지역, 기간, 이동수단, 추천 조건을 명시했다. | `AiPromptContextSummary.vue`, `AiLoadingView.vue`, `AiResultView.vue` | 자동 QA 통과 | raw prompt 내부는 노출하지 않음 |

## 4. 새로 분리한 컴포넌트

- `src/components/ai/AiPromptContextSummary.vue`
- `src/components/auth/AuthSessionPanel.vue`
- `src/components/auth/SignupValidationPanel.vue`
- `src/components/common/FavoriteToggleStatus.vue`
- `src/components/community/CommentActionSheet.vue`
- `src/components/community/CommentThread.vue`
- `src/components/community/CommunityPostDetailPanel.vue`
- `src/components/course/RouteProgressSummary.vue`
- `src/components/detail/DetailNotFoundPanel.vue`
- `src/components/follow/AuthorFollowCard.vue`
- `src/components/follow/FollowUserListItem.vue`
- `src/components/review/ReviewPanel.vue`

## 5. QA 결과

| 항목 | 결과 | 비고 |
| --- | --- | --- |
| `npm run lint` | 통과 | frontend 구조 및 금지 stack 검사 통과 |
| `npm run build` | 통과 | Vite chunk size 경고만 출력 |
| `npm run smoke:course` | 통과 | Course API smoke check passed |
| `npm run smoke:errors` | 통과 | Frontend error handling checks passed |
| `git diff --check` | 통과 | 공백 오류 없음, Windows CRLF 변환 경고만 출력 |
| 프론트 직접 AI 호출 검사 | 통과 | `src`, `scripts`에서 `sceniK-ai`, `localhost:8000`, `127.0.0.1:8000` 직접 호출 없음 |
| 비밀 키 패턴 검사 | 통과 | `AIza`, `sk-*`, private key 패턴 없음 |
| Community native sort select 검사 | 통과 | `CommunityView.vue`에 `<select>` 없음 |
| BrandLogo inline SVG 검사 | 통과 | `src/components/brand`에 `<svg>` 없음 |

## 6. 수동 QA 필요 항목

- 로그인 사용자로 커뮤니티 게시글 생성, 수정, 삭제 상태 확인
- 장소 상세에서 리뷰 작성, 수정, 삭제, 중복 리뷰 안내 확인
- 콘텐츠/장소 목록 URL을 복사한 뒤 검색/정렬/필터 상태 복원 확인
- 잘못된 콘텐츠, 장소, 코스, 커뮤니티 글 ID 진입 시 복구 UI 확인
- 팔로우/언팔로우 pending 상태와 맞팔 badge 확인
- AI loading/result 화면에서 조건 요약이 실제 선택값과 일치하는지 확인
- 360px, 393px, 430px 모바일 폭에서 가로 overflow 여부 확인

## 7. 남은 한계

- 이번 작업은 analyzer-visible 구조 보강이며, 점수 상승을 확정하지 않는다.
- 커뮤니티 상세를 완전한 별도 View로 분리하는 작업은 현재 `CommunityView` 내부 상태와 CRUD 흐름의 회귀 위험이 커서 패널 분리로 제한했다.
- backend와 `sceniK-ai`는 변경하지 않았다.

## 8. 최종 targeted pass 추가 보강

생성일: 2026-06-09

최신 analyzer 결과에서 남은 프론트 partial 항목인 `#01 Core data management CRUD`, `#07 Profile management`를 대상으로 추가 보강했다. 점수 상승을 확정하지 않고, evaluator가 화면 구조와 상태를 더 쉽게 식별하도록 하는 데 목적을 둔다.

| 항목 | 보강 내용 | 파일 |
| --- | --- | --- |
| #01 Course CRUD | `CourseCrudPanel`로 코스 관리 섹션, routeId, 장소 수, 수정/저장/공유/삭제 action을 명시했다. | `CourseDetailView.vue`, `CourseCrudPanel.vue` |
| #01 Course save | `CourseSaveStatusPanel`로 AI 결과 저장 전 확인, 저장 중/성공/실패, 저장 후 수정 가능 안내를 표시했다. | `AiResultView.vue`, `CourseSaveStatusPanel.vue` |
| #01 Course delete | `CourseDeleteActionSheet`로 삭제 confirmation과 삭제 중 상태를 분리했다. | `CourseDetailView.vue`, `CourseDeleteActionSheet.vue` |
| #01 Course edit | 코스 제목 field, 장소 수 validation, `변경사항 저장`, `취소`, 저장 상태 안내를 추가했다. | `CourseEditView.vue` |
| #07 Profile preview | profile image local preview와 upload deferred 안내를 추가했다. | `MyProfileEditView.vue` |
| #07 Profile preferences | 이메일 read-only, nickname/bio, preference chips, `aria-pressed`, MyPage preference summary를 보강했다. | `MyProfileEditView.vue`, `MyPageView.vue` |

남은 수동 QA:
- 코스 저장, 편집 저장, 삭제 confirmation/status 확인
- 프로필 이미지 local preview 확인
- 프로필 preference 저장 후 MyPage summary 반영 확인

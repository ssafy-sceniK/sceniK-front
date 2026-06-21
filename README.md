# sceniK Frontend

sceniK 프론트엔드는 Vue 3와 Vite로 만든 모바일 우선 웹 애플리케이션입니다. K-content 기반 장소 탐색, AI 여행 코스 생성, 커뮤니티, 마이페이지 기능을 제공합니다.

프론트엔드는 Spring Boot 백엔드만 호출합니다. AI API, GMS API, 백엔드 secret은 프론트엔드 코드나 환경 변수에 두지 않습니다.

## 기술 스택

- Vue 3.5
- Vite 7
- Vue Router 4
- Pinia
- Axios
- JavaScript ES Modules
- CSS Modules가 아닌 전역 CSS 파일 기반 스타일 구성

## 프로젝트 폴더 구조

```text
sceniK-front/
├── public/
│   └── images/                 # 정적 이미지
├── scripts/                    # 프론트 점검 스크립트
├── src/
│   ├── adapters/               # 응답 검증/변환 어댑터
│   ├── api/                    # Axios API 클라이언트
│   ├── assets/                 # 브랜드 이미지 등 번들 자산
│   ├── components/             # 공통/도메인 컴포넌트
│   ├── data/                   # 임시/목업 데이터
│   ├── router/                 # Vue Router 설정
│   ├── stores/                 # Pinia 상태 관리
│   ├── styles/                 # 전역 CSS
│   ├── utils/                  # 날짜, 지도, 이미지 유틸
│   ├── views/                  # 페이지 단위 View
│   ├── App.vue
│   └── main.js
├── docs/                       # UI/QA/디자인 문서
├── index.html
├── package.json
├── package-lock.json
└── vite.config.js
```

## 라우트 경로

| 경로 | 이름 | 화면 |
| --- | --- | --- |
| `/` | `splash` | 스플래시 |
| `/login` | `login` | 로그인 |
| `/oauth/callback` | `oauth-callback` | OAuth 콜백 |
| `/signup` | `signup` | 회원가입 |
| `/preferences` | `preferences` | 선호도 설정 |
| `/home` | `home` | 홈 |
| `/home/recent-all` | `home-recent-all` | 최근 본 장소 |
| `/home/content-all` | `home-content-all` | 콘텐츠 목록 |
| `/home/routes-all` | `home-routes-all` | 인기 여행 코스 |
| `/contents` | `contents` | 콘텐츠 목록 |
| `/contents/:id` | `content-detail` | 콘텐츠 상세 |
| `/places` | `places` | 장소 목록 |
| `/places/:id` | `place-detail` | 장소 상세 |
| `/search` | `search` | 통합 검색 |
| `/ai` | `ai-course` | AI 코스 시작 |
| `/ai/conditions` | `ai-conditions` | AI 코스 조건 입력 |
| `/ai/loading` | `ai-loading` | AI 코스 생성 로딩 |
| `/ai/courses/:routeId` | `course-detail` | AI 코스 상세 |
| `/ai/result` | `ai-result` | AI 코스 결과 |
| `/ai/save-share` | `ai-save-share` | AI 코스 저장/공유 |
| `/ai/edit` | `ai-edit` | AI 코스 편집 |
| `/explore` | `explore` | 탐색 |
| `/explore/search-empty` | `explore-search-empty` | 탐색 검색 빈 상태 |
| `/explore/search-results` | `explore-search-results` | 탐색 검색 결과 |
| `/explore/content-detail/:id?` | `explore-content-detail` | 탐색 콘텐츠 상세 |
| `/explore/place-detail/:id?` | `explore-place-detail` | 탐색 장소 상세 |
| `/explore/place/reviews` | `place-reviews` | 리뷰 목록 |
| `/explore/place/review/write` | `review-write` | 리뷰 작성 |
| `/explore/map` | `explore-map` | 지도 |
| `/explore/map/search-recent` | `explore-map-search-recent` | 지도 최근 검색 |
| `/explore/map-search` | `explore-map-search` | 지도 검색 |
| `/community` | `community` | 커뮤니티 |
| `/community/post/:id?` | `community-post` | 커뮤니티 글 상세 |
| `/community/write` | `community-write` | 커뮤니티 글 작성 |
| `/community/boards` | `community-boards` | 커뮤니티 게시판 |
| `/community/drama-board` | `community-drama-board` | 드라마 게시판 |
| `/community/search` | `community-search` | 커뮤니티 검색 |
| `/community/edit` | `community-edit` | 커뮤니티 글 수정 |
| `/my` | `my` | 마이페이지 |
| `/my/activity/liked-content` | `my-liked-content` | 좋아한 콘텐츠 |
| `/my/activity/liked-places` | `my-liked-places` | 좋아한 장소 |
| `/my/activity/saved-routes` | `my-saved-routes` | 저장한 AI 코스 |
| `/my/activity/reviews` | `my-reviews` | 내 리뷰 |
| `/my/following` | `my-following` | 팔로잉 |
| `/my/followers` | `my-followers` | 팔로워 |
| `/my/visit-planned` | `my-visit-planned` | 방문 예정 |
| `/my/visit-completed` | `my-visit-completed` | 방문 완료 |
| `/my/visit-map` | `my-visit-map` | 방문 지도 |
| `/my/course-manage/add-place` | `my-course-add-place` | 코스 장소 추가 |
| `/my/course-manage/:routeId/edit` | `my-course-edit-with-id` | 저장 코스 편집 |
| `/my/course-manage/edit` | `my-course-edit` | 코스 편집 |
| `/my/course-manage/:routeId?` | `my-course-manage` | 코스 관리 |
| `/my/posts` | `my-posts` | 내가 쓴 글 |
| `/my/comments` | `my-comments` | 댓글 단 글 |
| `/my/scraps` | `my-scraps` | 저장한 글 |
| `/my/profile-edit` | `my-profile-edit` | 프로필 수정 |
| `/my/settings` | `my-settings` | 마이페이지 설정 |
| `/notifications` | `notifications` | 알림 |
| `/settings` | `settings` | 설정 |
| `/notice` | `notice` | 공지 목록 |
| `/notice/:id` | `notice-detail` | 공지 상세 |
| `/admin` | redirect | `/admin/contents`로 이동 |
| `/admin/contents` | `admin-contents` | 콘텐츠 관리자 |
| `/admin/places` | `admin-places` | 장소 관리자 |
| `/:pathMatch(.*)*` | redirect | `/home`으로 이동 |

## 환경 변수 설정

필요하면 `.env.example`을 참고해 `.env`를 생성합니다.

```properties
VITE_API_BASE_URL=http://localhost:8080/api
VITE_KAKAO_MAP_APP_KEY=your_kakao_javascript_key
VITE_KAKAO_MAP_JAVASCRIPT_KEY=your_kakao_javascript_key
VITE_ENABLE_LOCAL_AI_FALLBACK=false
```

환경 변수 설명:

| 변수 | 설명 |
| --- | --- |
| `VITE_API_BASE_URL` | Spring Boot 백엔드 API 주소 |
| `VITE_KAKAO_MAP_APP_KEY` | Kakao Maps JavaScript 키 |
| `VITE_KAKAO_MAP_JAVASCRIPT_KEY` | 기존 호환용 Kakao Maps JavaScript 키 |
| `VITE_ENABLE_LOCAL_AI_FALLBACK` | 백엔드 AI 연동 실패 시 로컬 데모 fallback 사용 여부. 실제 연동에서는 `false` 유지 |

주의:

- 프론트엔드에는 `GMS_KEY`, OAuth secret, DB password를 넣지 않습니다.
- 프론트엔드는 `/api` 또는 `VITE_API_BASE_URL`을 통해 Spring Boot 백엔드만 호출합니다.
- AI 코스 생성은 `/api/ai/routes` 백엔드 API를 통해 처리합니다.

## 설치 및 실행 방법

```bash
cd /Users/kellys-mac/Desktop/sceniK/sceniK-front
npm install
npm run dev
```

Vite 개발 서버 기본 주소:

```text
http://127.0.0.1:5173/
```

## 빌드 및 점검

```bash
npm run build
npm run lint
npm run smoke:errors
npm run smoke:course
```

현재 `package.json`에는 `preview` 스크립트가 정의되어 있지 않습니다. 배포 빌드 미리보기가 필요하면 `package.json`에 `preview` 스크립트를 추가한 뒤 사용합니다.

## 개발 규칙

- 기존 5개 하단 탭 구조를 유지합니다: AI Course, Explore, Home, Community, My Page.
- 백엔드 데이터의 원본 상태를 `localStorage`에 의존하지 않습니다.
- `localStorage`는 임시 UI 상태, 필터, draft, 명시적 fallback cache 용도로만 사용합니다.
- API 오류와 폼 오류는 사용자 친화적인 한국어 메시지로 표시합니다.
- React, Next.js, Tailwind, Bootstrap, 외부 UI 라이브러리는 명시 승인 없이 추가하지 않습니다.

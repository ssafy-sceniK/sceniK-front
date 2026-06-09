# 로고 및 커뮤니티 정렬 UI 개선 QA

## 변경 목적

- 이전 작업에서 헤더 로고가 새로 그린 인라인 SVG 워드마크로 바뀐 회귀를 수정했다.
- 원본 로고의 형태, 비율, 글자 모양, 점선 경로, 비행기 위치를 유지하고 색상만 sceniK 브랜드 블루로 변경했다.
- 커뮤니티 `최신순 / 인기순` 세그먼트 정렬 UI는 기존 기능 보존 차원에서 유지했다.

## 로고 적용 방식

- 원본 파일: `C:\Users\jaemy\Downloads\sceniK\logo_drafts\cleaned\scenik_single_wordmark_clean.png`
- 생성 파일: `src/assets/brand/scenik_single_wordmark_blue.png`
- 생성 방식: 원본 PNG의 알파 채널과 치수는 그대로 유지하고, 비투명 픽셀의 RGB만 `#0052ff`로 변경했다.
- 사용한 브랜드 색상: `src/styles/tokens.css`의 `--color-primary: #0052ff`
- `BrandLogo.vue`는 인라인 SVG를 사용하지 않고 생성된 PNG를 `<img alt="sceniK">`로 렌더링한다.

## 커뮤니티 정렬 UI 변경 전 문제

- native `<select>`는 모바일 화면에서 정렬 상태가 작고 약하게 보여 sceniK의 앱 스타일과 어울리지 않았다.
- `정렬` 라벨, 드롭다운, 결과 수가 한 줄에 있더라도 위계가 분명하지 않았다.
- 선택지가 `최신순`, `인기순` 2개뿐이므로 드롭다운보다 즉시 전환 가능한 세그먼트 컨트롤이 더 적합했다.

## 커뮤니티 정렬 UI 변경 후 개선점

- `CommunityView.vue`의 native sort `<select>`는 다시 추가하지 않았다.
- `SortSegmentedControl.vue`를 계속 사용해 `최신순`과 `인기순`을 바로 전환한다.
- 기존 `sort` 상태값과 `uiStore.loadCommunityPosts({ sort })` 호출은 유지된다.
- 선택 상태는 브랜드 블루 배경, 흰색 텍스트, 굵은 글꼴로 표시되어 색상만으로 구분하지 않는다.
- 결과 수는 조용한 보조 텍스트로 유지해 정렬 컨트롤보다 낮은 시각 위계를 갖는다.

## 접근성 고려사항

- 로고 이미지는 `alt="sceniK"`를 제공한다.
- 세그먼트 컨트롤은 `role="radiogroup"`과 `role="radio"`를 사용한다.
- 현재 선택 상태는 `aria-checked`로 노출한다.
- 좌우 및 상하 방향키로 정렬 옵션을 변경할 수 있다.
- 결과 수는 `aria-live="polite"`로 유지한다.

## 회귀 방지 확인 항목

- 회원가입, 로그인, 로그아웃 화면 흐름에 영향을 주는 파일은 변경하지 않았다.
- 콘텐츠 목록/상세, 장소 상세, 방문 상태, 리뷰 생성/목록/수정/삭제 파일은 변경하지 않았다.
- 팔로우/언팔로우 상태와 커뮤니티 게시글 상세의 작성자 팔로우 UI는 제거하지 않았다.
- 댓글 생성/수정/삭제/답글 UI는 제거하지 않았다.
- AI 조건 패널, AI 추천 이유 패널, 경로 저장 흐름 파일은 변경하지 않았다.
- 좋아요 pending 상태와 `aria-pressed` 처리 로직은 변경하지 않았다.
- 커뮤니티 검색, 탭, 더보기, 게시글 카드 흐름은 기존 상태값과 라우팅을 유지한다.

## QA 결과

| 항목 | 결과 | 비고 |
| --- | --- | --- |
| 원본/생성 PNG 치수 비교 | 통과 | 둘 다 `868x257` |
| 원본/생성 PNG 알파 비교 | 통과 | 알파 불일치 `0` |
| 생성 PNG 검은 픽셀 검사 | 통과 | 비투명 검은 픽셀 `0` |
| 생성 PNG 색상 검사 | 통과 | 비투명 픽셀 RGB는 모두 `#0052ff` |
| inline SVG 로고 비활성 검사 | 통과 | `BrandLogo.vue`에서 `<svg>` 제거 |
| 커뮤니티 native sort select 제거 | 통과 | `CommunityView.vue`의 `sort`용 `<select>` 없음 |
| `npm run lint` | 통과 | 로고 PNG 기준 검사로 갱신 |
| `npm run build` | 통과 | Vite chunk size 경고는 기존 번들 크기 경고 |
| `npm run smoke:course` | 통과 | 코스 smoke 확인 |
| `npm run smoke:errors` | 통과 | 에러 처리 smoke 확인 |
| `git diff --check` | 통과 | CRLF 변환 경고만 표시 |
| 프론트 직접 AI 호출 검사 | 통과 | `sceniK-ai`, `localhost:8000`, `127.0.0.1:8000` 직접 호출 없음 |
| 비밀 키 패턴 검사 | 통과 | 명백한 API key/private key 패턴 없음 |
| 금지 파일 Git 추적 검사 | 통과 | `node_modules/`, `dist/`는 존재하지만 Git 추적 대상 아님 |

## 남은 한계

- Windows 환경에서 이전 브라우저 캡처용 Vite 숨김 프로세스 기동 중 `액세스가 거부되었습니다.` 오류가 발생해 자동 브라우저 캡처 QA는 완료하지 못했다.
- 실제 화면 확인이 필요하면 아래 명령으로 수동 실행 후 `/home`과 `/community`를 확인한다.

```powershell
npm run dev
```

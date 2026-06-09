# Empty State UI 개선 QA

## 1. 변경 목적

My Page와 관련 목록 화면에서 데이터가 없을 때 보이는 empty state를 sceniK의 차분한 모바일 UI 톤에 맞게 정리했다. 기존 데이터 로딩, 에러, API 호출 로직은 변경하지 않고 시각 표현과 안내 문구만 개선했다.

## 2. 기존 empty state 문제

- 아이콘 영역과 장식 요소가 빈 카드의 무게감을 키워 주변 카드와 어색하게 보였다.
- CTA 버튼이 상대적으로 무겁고 큰 편이라 빈 상태 안내보다 버튼이 먼저 눈에 들어왔다.
- “없습니다” 중심의 문구가 딱딱해서 My Page의 개인 기록 화면과 잘 어울리지 않았다.
- 일부 목록 화면은 같은 컴포넌트를 쓰지만 compact 처리가 없어 모바일에서 빈 공간이 과하게 느껴질 수 있었다.

## 3. 공통 EmptyState 컴포넌트 설계

- 기존 `src/components/common/EmptyState.vue`를 유지하고 시각 스타일을 컴포넌트 내부 `scoped` 스타일로 개선했다.
- 작은 원형 아이콘, 15px대 제목, 13px 설명, compact CTA 구조로 정리했다.
- 기존 `text` prop을 유지하면서 `description` prop도 받을 수 있게 해 이후 화면에서 더 명확한 이름을 사용할 수 있게 했다.
- `variant` prop을 추가해 기본 카드형과 인라인형 표현을 확장할 수 있게 했다.
- `comments-panel`과 `course-recommend-panel` 안의 특수 empty state는 기존 레이아웃이 유지되도록 별도 보호 스타일을 뒀다.

## 4. 적용 화면

- My Page 방문 관리: 방문 기록 없음 카드 문구와 표현 개선
- My Page 연결 목록: 좋아요한 콘텐츠, 좋아요한 장소, 최근 본 장소, 방문 예정, 방문 완료
- My Page 활동 목록: 저장한 코스, 작성한 게시글, 댓글 단 글, 스크랩한 게시글, 작성한 리뷰
- 팔로잉/팔로워 목록과 기본 fallback 목록
- 기존 `EmptyState`를 사용하는 검색, 상세, 알림, 커뮤니티 화면은 공통 컴포넌트 스타일 개선 효과를 함께 받는다.

## 5. CTA 정책

- 빈 상태 CTA는 데이터 생성 또는 탐색이 가능한 기존 경로로만 연결한다.
- 방문 기록 없음: `장소 탐색하기` -> `/places`
- 저장한 코스 없음: `AI 코스 만들기` -> `/ai`, 보조 CTA `인기 코스 보기` -> `/home/routes-all`
- 게시글 없음: `게시글 작성하기` -> `/community/write`
- 좋아요/스크랩/댓글/리뷰 관련 empty state는 기존 탐색 경로를 유지했다.

## 6. 접근성 고려사항

- 아이콘 영역은 `aria-hidden="true"`로 유지해 텍스트 설명과 중복 낭독되지 않게 했다.
- CTA는 기존 `RouterLink` 또는 `button`을 사용해 키보드 접근성을 유지했다.
- `focus-visible` 스타일을 추가해 키보드 포커스 위치가 보이도록 했다.
- 빈 상태는 제목과 설명 텍스트를 중심으로 이해되도록 구성했다.

## 7. 회귀 방지 확인 항목

- Header 로고 PNG 참조를 변경하지 않는다.
- Community sort UI, 댓글/답글 UI, follow/unfollow, toast, settings, review, AI, route 저장 로직을 변경하지 않는다.
- 로딩 상태와 에러 상태 조건을 빈 상태 조건으로 합치지 않는다.
- fake data를 추가하지 않는다.
- frontend에서 `sceniK-ai` 또는 `localhost:8000`을 직접 호출하지 않는다.
- `.env`, `node_modules`, `dist`, `build` 등 금지 파일을 staging하지 않는다.

## 8. QA 결과

아래 명령으로 검증했다.

```bash
npm run lint
npm run build
npm run smoke:course
npm run smoke:errors
git diff --check
```

- `npm run lint`: 통과
- `npm run build`: 통과
- `npm run smoke:course`: 통과
- `npm run smoke:errors`: 통과
- `git diff --check`: 공백 오류 없음. Windows 줄바꿈 변환 경고만 출력됨.

정적 확인 결과:

- frontend에서 `sceniK-ai`, `localhost:8000`, `127.0.0.1:8000` 직접 호출 없음
- Header 로고는 기존 PNG 기반 `BrandLogo` 참조 유지
- Community 정렬 UI는 `SortSegmentedControl` 참조 유지
- 이번 작업에서 fake data 추가 없음
- 이번 작업 범위에 `.env`, `node_modules`, `dist`, `build` 파일 포함 없음

## 9. 남은 한계

- 실제 빈 데이터 계정으로의 브라우저 시각 QA는 별도 수동 확인이 필요하다.
- 이번 작업은 empty state 표현 개선에 한정되어, 각 화면의 정보 구조나 API 상태 처리는 변경하지 않았다.

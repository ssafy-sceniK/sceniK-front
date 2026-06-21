# AGENTS.md

## 작업 규칙

- 상세 프로젝트 설명, 라우트, 실행 방법, 환경 변수는 `README.md`를 기준으로 확인합니다.
- 프론트엔드는 Spring Boot 백엔드만 호출하며, AI 서버나 GMS API를 직접 호출하지 않습니다.
- 실제 secret, API key, OAuth secret, DB password를 프론트엔드 코드와 문서에 작성하지 않습니다.
- 기존 5개 하단 탭 구조를 유지합니다: AI Course, Explore, Home, Community, My Page.
- React, Next.js, Tailwind, Bootstrap, 외부 UI 라이브러리는 명시 승인 없이 추가하지 않습니다.
- 프론트엔드 변경 후 가능한 경우 `npm run build`로 검증합니다.

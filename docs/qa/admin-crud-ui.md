# 관리자 CRUD UI 검증 안내

## 변경 목적

Rubric #01 핵심 데이터 관리 CRUD 평가에서 콘텐츠/장소 원본 데이터를 운영자 화면으로 직접 생성, 수정, 삭제할 수 있음을 보여주기 위한 최소 관리자 UI입니다.

## 화면 경로

- `/admin`
- `/admin/contents`
- `/admin/places`

## Demo 관리자 계정

backend `src/main/resources/data.sql`에서 로컬 평가용 admin 계정을 seed합니다.

| Email | Password | Role |
| --- | --- | --- |
| `admin@scenik.local` | `admin1234` | `ROLE_ADMIN` |

## 검증 항목

1. 관리자 계정으로 로그인합니다.
2. `/admin/contents`에서 콘텐츠 목록을 확인합니다.
3. 새 콘텐츠를 생성하고 목록에 반영되는지 확인합니다.
4. 생성한 콘텐츠를 수정하고 변경 값이 유지되는지 확인합니다.
5. 생성한 콘텐츠를 삭제하고 공개 콘텐츠 상세에서 제외되는지 확인합니다.
6. `/admin/places`에서 장소 생성, 수정, 삭제를 같은 방식으로 확인합니다.
7. 일반 사용자 계정으로 접근하면 관리자 권한 필요 안내가 표시되는지 확인합니다.
8. HTTP 파일로 `ROLE_USER` token 요청이 `403 FORBIDDEN`을 반환하는지 확인합니다.

## 접근 제어

- token 없음: 로그인 필요 안내
- `ROLE_USER`: 관리자 권한 필요 안내, backend admin API는 `403 FORBIDDEN`
- `ROLE_ADMIN`: 콘텐츠/장소 CUD 가능

## 관련 파일

- `frontend/src/views/AdminView.vue`
- `frontend/src/api/adminApi.js`
- `frontend/src/router/index.js`
- `backend/src/main/java/com/scenik/service/AdminService.java`
- `backend/api-tests/content-crud-validation.http`

## 남은 한계

이 화면은 평가 검증용 최소 운영자 UI입니다. 대량 편집, 감사 로그, 운영자 검색/필터 고도화는 포함하지 않습니다.

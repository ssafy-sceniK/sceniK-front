import { getFieldErrors, getUserMessage } from '../src/api/error.js';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

assert(
  getUserMessage({
    response: {
      status: 400,
      data: {
        code: 'VALIDATION_ERROR',
        message: '입력값을 확인해 주세요.',
        fieldErrors: [{ field: 'password', message: '비밀번호는 8자 이상이어야 합니다.' }],
      },
    },
  }) === '비밀번호는 8자 이상이어야 합니다.',
  'field error message should be preferred',
);

assert(
  getUserMessage({
    response: {
      status: 409,
      data: { code: 'DUPLICATE_EMAIL', message: '이미 사용 중인 이메일입니다.' },
    },
  }) === '이미 사용 중인 이메일입니다.',
  'backend message should be used when present',
);

assert(
  getUserMessage({ response: { status: 401, data: { message: '가입되지 않았거나 비밀번호가 올바르지 않습니다.' } } })
    === '가입되지 않았거나 비밀번호가 올바르지 않습니다.',
  'backend login failure message should be preserved',
);

assert(
  getUserMessage({ response: { status: 401, data: {} } })
    === '로그인이 필요하거나 로그인 정보가 올바르지 않습니다.',
  '401 without body should use generic auth fallback',
);

assert(
  getUserMessage({ response: { status: 500, data: { message: 'SQL syntax error near users' } } })
    === '일시적인 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.',
  '500 should not expose technical backend messages',
);

assert(
  getUserMessage({ request: {}, message: 'Network Error' })
    === '서버에 연결할 수 없습니다. 백엔드 서버가 실행 중인지 확인해 주세요.',
  'network errors should explain backend connectivity',
);

assert(
  getUserMessage(new Error('비밀번호는 8자 이상이어야 합니다.')) === '비밀번호는 8자 이상이어야 합니다.',
  'safe plain validation errors should be preserved',
);

assert(
  getUserMessage(new Error('Request failed with status code 401')) === '요청 처리 중 오류가 발생했습니다.',
  'technical plain errors should not leak',
);

assert(
  getUserMessage(
    new Error('Unknown placeId outside candidate list: P_BAD.'),
    '코스 장소 정보가 올바르지 않습니다. 다시 생성해 주세요.',
  ) === '코스 장소 정보가 올바르지 않습니다. 다시 생성해 주세요.',
  'internal route validation errors should not leak',
);

assert(
  getFieldErrors({
    response: {
      data: {
        fieldErrors: [{ field: 'email', message: '이메일을 입력해 주세요.' }],
      },
    },
  })[0].field === 'email',
  'field error parser should expose field names',
);

console.log('Frontend error handling checks passed');

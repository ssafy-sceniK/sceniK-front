const SERVER_UNAVAILABLE_MESSAGE = '서버에 연결할 수 없습니다. 백엔드 서버가 실행 중인지 확인해 주세요.';
const TEMPORARY_ERROR_MESSAGE = '일시적인 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.';
const DEFAULT_ERROR_MESSAGE = '요청 처리 중 오류가 발생했습니다.';
const TECHNICAL_MESSAGE_PATTERNS = [
  /^Request failed/i,
  /^Network Error$/i,
  /^Bad Request$/i,
  /^Unauthorized$/i,
  /^Forbidden$/i,
  /^Not Found$/i,
  /^Internal Server Error$/i,
  /^\d{3}$/,
  /\b\d{3}\s+(Bad Request|Unauthorized|Forbidden|Not Found|Internal Server Error)\b/i,
  /status code \d{3}/i,
  /^Route must include/i,
  /^Candidate place/i,
  /^Duplicate candidate/i,
  /^Route day count/i,
  /^Invalid dayNumber/i,
  /^dayNumber must be/i,
  /^Duplicate dayNumber/i,
  /^Day \d+ must include/i,
  /^Missing .+ for day/i,
  /^Unknown placeId/i,
  /^Duplicate route placeId/i,
  /^Stop .+ has mismatched/i,
  /^Invalid visitOrder/i,
  /^visitOrder must be/i,
  /^Duplicate visitOrder/i,
];

function isSafePlainMessage(message) {
  const trimmed = typeof message === 'string' ? message.trim() : '';
  if (!trimmed) return false;
  return !TECHNICAL_MESSAGE_PATTERNS.some((pattern) => pattern.test(trimmed));
}

export function getFieldErrors(error) {
  const fieldErrors = error?.response?.data?.fieldErrors;
  if (!Array.isArray(fieldErrors)) return [];
  return fieldErrors
    .filter((fieldError) => fieldError?.message)
    .map((fieldError) => ({
      field: fieldError.field ?? '',
      message: fieldError.message,
    }));
}

export function getUserMessage(error, fallback = DEFAULT_ERROR_MESSAGE) {
  const response = error?.response;
  const status = response?.status;
  const data = response?.data;
  const firstFieldError = getFieldErrors(error)[0]?.message;

  if (isSafePlainMessage(error?.userMessage)) return error.userMessage.trim();

  if (firstFieldError) return firstFieldError;

  if (status >= 500) return TEMPORARY_ERROR_MESSAGE;

  if (typeof data?.message === 'string' && data.message.trim()) {
    return data.message.trim();
  }

  if (!response && (error?.request || error?.code === 'ERR_NETWORK' || error?.message === 'Network Error')) {
    return SERVER_UNAVAILABLE_MESSAGE;
  }

  if (status === 401) return '로그인이 필요하거나 로그인 정보가 올바르지 않습니다.';
  if (status === 403) return '권한이 없습니다.';
  if (status === 404) return '요청한 정보를 찾을 수 없습니다.';
  if (status === 409) return '이미 처리된 요청이거나 중복된 데이터입니다.';
  if (status === 400) return '입력값을 확인해 주세요.';

  if (!response && isSafePlainMessage(error?.message)) {
    return error.message.trim();
  }

  return fallback;
}

export function attachUserMessage(error) {
  if (error && !error.userMessage) {
    error.userMessage = getUserMessage(error);
  }
  return error;
}

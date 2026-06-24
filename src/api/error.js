const SERVER_UNAVAILABLE_MESSAGE = '\uc11c\ubc84\uc5d0 \uc5f0\uacb0\ud560 \uc218 \uc5c6\uc2b5\ub2c8\ub2e4. \ubc31\uc5d4\ub4dc \uc11c\ubc84\uac00 \uc2e4\ud589 \uc911\uc778\uc9c0 \ud655\uc778\ud574 \uc8fc\uc138\uc694.';
const TEMPORARY_ERROR_MESSAGE = '\uc77c\uc2dc\uc801\uc778 \uc624\ub958\uac00 \ubc1c\uc0dd\ud588\uc2b5\ub2c8\ub2e4. \uc7a0\uc2dc \ud6c4 \ub2e4\uc2dc \uc2dc\ub3c4\ud574 \uc8fc\uc138\uc694.';
const DEFAULT_ERROR_MESSAGE = '\uc694\uccad \ucc98\ub9ac \uc911 \uc624\ub958\uac00 \ubc1c\uc0dd\ud588\uc2b5\ub2c8\ub2e4.';
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
  const responseData = error?.response?.data;
  const fieldErrors = responseData?.fieldErrors ?? responseData?.data?.fieldErrors;
  if (!Array.isArray(fieldErrors)) return [];
  return fieldErrors
    .filter((fieldError) => fieldError?.message)
    .map((fieldError) => ({
      field: fieldError.field ?? '',
      message: fieldError.message,
    }));
}

export function unwrapApiData(payload) {
  if (
    payload
    && typeof payload === 'object'
    && Object.prototype.hasOwnProperty.call(payload, 'success')
    && Object.prototype.hasOwnProperty.call(payload, 'data')
  ) {
    return payload.data;
  }
  return payload;
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

  if (status === 401) return '\ub85c\uadf8\uc778\uc774 \ud544\uc694\ud558\uac70\ub098 \ub85c\uadf8\uc778 \uc815\ubcf4\uac00 \uc62c\ubc14\ub974\uc9c0 \uc54a\uc2b5\ub2c8\ub2e4.';
  if (status === 403) return '\uad8c\ud55c\uc774 \uc5c6\uc2b5\ub2c8\ub2e4.';
  if (status === 404) return '\uc694\uccad\ud55c \uc815\ubcf4\ub97c \ucc3e\uc744 \uc218 \uc5c6\uc2b5\ub2c8\ub2e4.';
  if (status === 409) return '\uc774\ubbf8 \ucc98\ub9ac\ub41c \uc694\uccad\uc774\uac70\ub098 \uc911\ubcf5\ub41c \ub370\uc774\ud130\uc785\ub2c8\ub2e4.';
  if (status === 400) return '\uc785\ub825\uac12\uc744 \ud655\uc778\ud574 \uc8fc\uc138\uc694.';

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

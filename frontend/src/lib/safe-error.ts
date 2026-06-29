/**
 * Safe error message extraction - never exposes internal code or stack traces
 * Returns user-friendly messages for common errors
 */

const FRIENDLY_MESSAGES: Record<string, string> = {
  // Network errors
  'Failed to fetch': 'Unable to connect to the server. Please check your internet connection.',
  'Network Error': 'Network error. Please check your internet connection.',
  'NetworkError': 'Network error. Please check your internet connection.',

  // Auth errors
  'Unauthorized': 'Please login to continue.',
  '401': 'Please login to continue.',
  '403': 'You do not have permission to perform this action.',
  '404': 'The requested resource was not found.',
  '500': 'Something went wrong on our end. Please try again later.',
  '502': 'Server is temporarily unavailable. Please try again later.',
  '503': 'Server is under maintenance. Please try again later.',
};

const GENERIC_FALLBACK = 'Something went wrong. Please try again.';

export function getSafeErrorMessage(err: any, fallback?: string): string {
  // If no error, return fallback
  if (!err) return fallback || GENERIC_FALLBACK;

  // If it's a string, check if it's safe (not a webpack module path)
  if (typeof err === 'string') {
    if (err.includes('WEBPACK_IMPORTED') || err.includes('__webpack_require__') || err.includes('is not a function')) {
      return GENERIC_FALLBACK;
    }
    return err.length > 200 ? GENERIC_FALLBACK : err;
  }

  // Network errors
  if (err.code === 'ERR_NETWORK' || err.message?.includes('Failed to fetch')) {
    return 'Unable to connect to the server. Please check your internet connection.';
  }

  // Timeout
  if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
    return 'Request timed out. Please try again.';
  }

  // HTTP status errors
  const status = err.response?.status || err.status;

  // Axios response with message (check FIRST to get actual server message)
  const serverMsg = err.response?.data?.message;
  if (serverMsg && typeof serverMsg === 'string') {
    if (serverMsg.includes('WEBPACK') || serverMsg.includes('is not a function') || serverMsg.includes('__webpack')) {
      return GENERIC_FALLBACK;
    }
    if (serverMsg.length < 150 && !serverMsg.includes('Error:') && !serverMsg.includes('at ')) {
      return serverMsg;
    }
  }

  if (status && FRIENDLY_MESSAGES[String(status)]) {
    return FRIENDLY_MESSAGES[String(status)];
  }

  // Check message property
  const msg = err.message;
  if (msg) {
    if (msg.includes('WEBPACK_IMPORTED') || msg.includes('is not a function') || msg.includes('__webpack') || msg.includes('Module not found')) {
      return GENERIC_FALLBACK;
    }
    // Known patterns
    for (const [pattern, friendly] of Object.entries(FRIENDLY_MESSAGES)) {
      if (msg.includes(pattern)) {
        return friendly;
      }
    }
  }

  return fallback || GENERIC_FALLBACK;
}

export function isNetworkError(err: any): boolean {
  if (!err) return false;
  if (err.code === 'ERR_NETWORK') return true;
  if (err.message?.includes('Failed to fetch')) return true;
  if (err.message?.includes('Network Error')) return true;
  if (!err.response && err.request) return true;
  return false;
}

export function isAuthError(err: any): boolean {
  if (!err) return false;
  const status = err.response?.status || err.status;
  if (status === 401 || status === 403) return true;
  if (err.message?.includes('Unauthorized')) return true;
  return false;
}

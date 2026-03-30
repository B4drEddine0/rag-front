export function getHttpErrorMessage(err: unknown, fallback: string): string {
  const e = err as { status?: number; error?: { message?: string; detail?: string; errors?: Record<string, string> } } | null;

  const message = e?.error?.message;
  if (typeof message === 'string' && message.trim()) {
    return message.trim();
  }

  const detail = e?.error?.detail;
  if (typeof detail === 'string' && detail.trim()) {
    return detail.trim();
  }

  const fieldErrors = e?.error?.errors;
  if (fieldErrors && typeof fieldErrors === 'object') {
    const values = Object.values(fieldErrors).filter((v): v is string => typeof v === 'string' && v.trim().length > 0);
    if (values.length) {
      return values.join(', ');
    }
  }

  if (e?.status === 0) {
    return 'Unable to reach server. Please check your connection and try again.';
  }

  return fallback;
}

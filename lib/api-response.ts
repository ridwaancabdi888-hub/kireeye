type ErrorPayload = { error?: unknown };

function isObjectPayload(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export async function readApiResponse<T extends object>(
  response: Response,
  fallbackMessage: string,
  requiredFields: readonly (keyof T)[] = [],
): Promise<T> {
  let payload: unknown;

  try {
    payload = await response.json();
  } catch {
    throw new Error(fallbackMessage);
  }

  if (!isObjectPayload(payload)) {
    throw new Error(fallbackMessage);
  }

  if (!response.ok) {
    const error = (payload as ErrorPayload).error;
    throw new Error(typeof error === "string" && error.trim() ? error : fallbackMessage);
  }

  if (requiredFields.some(field => !Object.prototype.hasOwnProperty.call(payload, field))) {
    throw new Error(fallbackMessage);
  }

  return payload as T;
}

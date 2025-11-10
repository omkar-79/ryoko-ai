/**
 * Recursively removes undefined values from an object
 * Firebase doesn't allow undefined values, so we need to clean them before saving
 */
export function removeUndefined<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return obj as T;
  }

  if (Array.isArray(obj)) {
    return obj
      .map((item) => removeUndefined(item))
      .filter((item) => item !== undefined) as T;
  }

  if (typeof obj === 'object') {
    const cleaned: any = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        cleaned[key] = removeUndefined(value);
      }
    }
    return cleaned as T;
  }

  return obj;
}

/**
 * Converts undefined values to null (alternative approach)
 * Use this if you want to preserve the structure but convert undefined to null
 */
export function undefinedToNull<T>(obj: T): T {
  if (obj === undefined) {
    return null as T;
  }

  if (obj === null) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => undefinedToNull(item)) as T;
  }

  if (typeof obj === 'object') {
    const converted: any = {};
    for (const [key, value] of Object.entries(obj)) {
      converted[key] = undefinedToNull(value);
    }
    return converted as T;
  }

  return obj;
}


/**
 * Utility to transform objects between camelCase (FE) and snake_case (DB).
 */

export function toCamel(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map((v) => toCamel(v));
  } else if (obj !== null && obj.constructor === Object) {
    return Object.keys(obj).reduce(
      (result, key) => ({
        ...result,
        [key.replace(/(_\w)/g, (m) => m[1].toUpperCase())]: toCamel(obj[key]),
      }),
      {}
    );
  }
  return obj;
}

export function toSnake(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map((v) => toSnake(v));
  } else if (obj !== null && obj.constructor === Object) {
    return Object.keys(obj).reduce(
      (result, key) => ({
        ...result,
        [key.replace(/[A-Z]/g, (m) => `_${m.toLowerCase()}`)]: toSnake(obj[key]),
      }),
      {}
    );
  }
  return obj;
}

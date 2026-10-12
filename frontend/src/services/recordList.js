// Accept the array returned by native routes and common paginated API envelopes.
// Invalid responses are errors, so a broken route cannot masquerade as an empty list.
export function recordList(payload) {
  if (Array.isArray(payload)) return payload;
  for (const key of ['data', 'items', 'results', 'rows', 'history']) {
    if (Array.isArray(payload?.[key])) return payload[key];
  }
  throw new TypeError('The records endpoint did not return a list');
}

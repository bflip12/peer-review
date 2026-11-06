// Longer than any city or venue name, so a real query is never cut.
const MAX_QUERY_LENGTH = 100;

/**
 * The `q` search param of an autocomplete request, trimmed. Null when it is missing,
 * blank, or longer than any name, so the route answers with no results and no query.
 */
export const getSearchQueryParam = (searchParams: URLSearchParams): string | null => {
  const query = searchParams.get("q")?.trim() ?? "";
  if (!query || [...query].length > MAX_QUERY_LENGTH) {
    return null;
  }
  return query;
};

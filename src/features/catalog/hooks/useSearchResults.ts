"use client";

import { useEffect, useState } from "react";

// Waits for a pause in typing before asking the server, so one word is one request.
const SEARCH_DELAY_MS = 250;

export type UseSearchResultsReturnT<ResultT> = {
  results: ResultT[];
  isSearching: boolean;
};

/**
 * Results from one of the app's autocomplete routes (`/api/cities`, `/api/venues/similar`)
 * for the URL given, fetched after a pause in typing. A null URL means "no search": the
 * results are empty. A newer URL cancels the request for an older one, so results never
 * arrive out of order. A failed request leaves the results empty; the form still works,
 * since the server checks what is sent.
 */
export const useSearchResults = <ResultT>(
  url: string | null
): UseSearchResultsReturnT<ResultT> => {
  const [response, setResponse] = useState<{ url: string; results: ResultT[] } | null>(
    null
  );

  useEffect(() => {
    if (!url) {
      return undefined;
    }
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      fetch(url, { signal: controller.signal })
        .then((reply) => (reply.ok ? (reply.json() as Promise<ResultT[]>) : []))
        .then((results) => {
          setResponse({ url, results });
        })
        .catch(() => {
          if (!controller.signal.aborted) {
            setResponse({ url, results: [] });
          }
        });
    }, SEARCH_DELAY_MS);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [url]);

  // Results for another URL are stale: show none while the current one loads.
  const isCurrent = url !== null && response?.url === url;
  return {
    results: isCurrent ? response.results : [],
    isSearching: url !== null && !isCurrent
  };
};

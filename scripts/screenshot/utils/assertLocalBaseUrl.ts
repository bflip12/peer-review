const LOCAL_HOSTS = ["localhost", "127.0.0.1"];

/**
 * Throws unless `baseUrl` is this machine. `--as` creates a user with the local stack's
 * service key, so the app at the base URL must use the local stack too.
 */
export const assertLocalBaseUrl = (baseUrl: string): void => {
  if (!LOCAL_HOSTS.includes(new URL(baseUrl).hostname)) {
    throw new Error(
      "--as signs in on the local Supabase stack, so it only works against localhost. " +
        `The base URL is ${baseUrl}.`
    );
  }
};

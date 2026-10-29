import { getLocalSupabase } from "./getLocalSupabase.ts";

type MailpitSearchT = { messages: { ID: string }[] };
type MailpitMessageT = { HTML: string };

// Mailpit stores a message a moment after Auth sends it.
const POLL_ATTEMPTS = 50;
const POLL_INTERVAL_MS = 100;

/**
 * The link in the newest sign-in email to `email`, read from the local stack's Mailpit.
 * Polls for up to 5 seconds, since the email arrives after the request that sends it.
 * Deletes the email once read, so the next call waits for a new one rather than
 * returning a link that was already used.
 */
export const getSignInLink = async (email: string): Promise<URL> => {
  const { mailUrl } = getLocalSupabase();
  const query = new URLSearchParams({ query: `to:"${email}"`, limit: "1" });
  for (let attempt = 0; attempt < POLL_ATTEMPTS; attempt++) {
    const search = (await fetch(`${mailUrl}/api/v1/search?${query}`).then((response) =>
      response.json()
    )) as MailpitSearchT;
    const [latest] = search.messages;
    if (latest) {
      const message = (await fetch(`${mailUrl}/api/v1/message/${latest.ID}`).then(
        (response) => response.json()
      )) as MailpitMessageT;
      await fetch(`${mailUrl}/api/v1/messages`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ IDs: [latest.ID] })
      });
      const href = /href="([^"]+)"/.exec(message.HTML)?.[1];
      if (!href) {
        throw new Error(`The email to ${email} has no link.`);
      }
      return new URL(href.replaceAll("&amp;", "&"));
    }
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }
  throw new Error(`No email to ${email} arrived within 5 seconds.`);
};

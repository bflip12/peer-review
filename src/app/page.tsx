import type { ReactElement } from "react";

/**
 * Home page. Shows the app name and what the app does until the feed exists. Renders
 * into the app shell's `<main>`, so it has no landmark of its own.
 */
const HomePage = (): ReactElement => (
  <>
    <h1>Peer Review</h1>
    <p>Log a night, rate the sound, the venue and each DJ set, and follow people.</p>
  </>
);

export default HomePage;

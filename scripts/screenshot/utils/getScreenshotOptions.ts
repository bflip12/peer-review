/**
 * Who the screenshots are taken as.
 *
 * - "user": signed in with a profile (handle `dj_rush`)
 * - "new": signed in before picking a handle, for `/welcome`
 */
export type SignedInAsT = "user" | "new";

/** The command line, split into the `--as` choice and the routes. */
export type ScreenshotOptionsT = { signedInAs: SignedInAsT | null; routes: string[] };

const SIGNED_IN_AS_VALUES: readonly SignedInAsT[] = ["user", "new"];
const AS_PREFIX = "--as=";

const isSignedInAs = (value: string): value is SignedInAsT =>
  (SIGNED_IN_AS_VALUES as readonly string[]).includes(value);

/**
 * Splits the arguments of `npm run screenshot` into `--as=user` or `--as=new` and the
 * routes. Without `--as` the pages are captured signed out. Throws on another `--as`
 * value, on `--as` given twice, and on any other flag.
 */
export const getScreenshotOptions = (args: string[]): ScreenshotOptionsT => {
  let signedInAs: SignedInAsT | null = null;
  const routes: string[] = [];
  for (const arg of args) {
    if (arg.startsWith(AS_PREFIX)) {
      const value = arg.slice(AS_PREFIX.length);
      if (!isSignedInAs(value)) {
        throw new Error(`Unknown --as value "${value}". Use --as=user or --as=new.`);
      }
      if (signedInAs) {
        throw new Error("Give --as once.");
      }
      signedInAs = value;
    } else if (arg.startsWith("-")) {
      throw new Error(`Unknown option "${arg}". The only option is --as.`);
    } else {
      routes.push(arg);
    }
  }
  return { signedInAs, routes };
};

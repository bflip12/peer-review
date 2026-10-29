import { z } from "zod";

/** The sign-in form: the address to send a sign-in link to. */
export const sendSignInLinkSchema = z.object({
  email: z.string().trim().pipe(z.email("Enter an email address, like name@example.com."))
});

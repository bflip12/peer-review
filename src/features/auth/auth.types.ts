import type { ActionResultT } from "@/lib/actions/actionResult.types";

/** A server action a form calls through `useActionState`. */
export type FormActionT = (
  previous: ActionResultT | null,
  formData: FormData
) => Promise<ActionResultT>;

import { notFound, redirect } from "next/navigation";
import type { ReactElement } from "react";

import { getSignedInUserId } from "@/features/auth/data/getSignedInUserId";
import { getLinkPlatforms } from "@/features/catalog/data/getLinkPlatforms";
import { createServerSupabaseClient } from "@/lib/supabase/createServerSupabaseClient";

import { saveDjEdits } from "./actions/saveDjEdits";
import { getCanEditDj } from "./data/getCanEditDj";
import { getDj } from "./data/getDj";
import { DjForm } from "./DjForm";
import { getDjValues } from "./utils/getDjValues";

export type EditDjPropsT = {
  params: Promise<{ shortId: string }>;
};

/**
 * The edit DJ page's form, filled in with the DJ as they are. Only someone who may edit
 * the DJ sees it: signed-out visitors are sent to sign in, and anyone else to the DJ's
 * page. Reads the session, so it renders inside `<Suspense>`.
 */
export const EditDj = async ({ params }: EditDjPropsT): Promise<ReactElement> => {
  const { shortId } = await params;
  const supabase = await createServerSupabaseClient();
  const [dj, userId, platforms] = await Promise.all([
    getDj(supabase, shortId),
    getSignedInUserId(supabase),
    getLinkPlatforms(supabase, "artist")
  ]);
  if (!dj) {
    notFound();
  }
  if (!userId) {
    redirect("/sign-in");
  }
  if (!(await getCanEditDj(supabase, { artistId: dj.id, userId }))) {
    redirect(`/djs/${dj.shortId}`);
  }
  return (
    <DjForm
      action={saveDjEdits.bind(null, dj.shortId)}
      platforms={platforms}
      submitLabel="Save DJ"
      initialValues={{ name: dj.name, city: dj.city, links: getDjValues(dj).links }}
    />
  );
};

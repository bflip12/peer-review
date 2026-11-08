"use client";

import { useActionState, useState } from "react";
import type { ReactElement } from "react";

import type { CityT, LinkPlatformT } from "@/features/catalog/catalog.types";
import { CityPicker } from "@/features/catalog/CityPicker";
import { useSearchResults } from "@/features/catalog/hooks/useSearchResults";
import { getLinkFieldName } from "@/features/catalog/utils/getLinkFieldName";
import { FormError } from "@/features/forms/FormError";
import { SubmitButton } from "@/features/forms/SubmitButton";
import { TextField } from "@/features/forms/TextField";
import type { ActionResultT } from "@/lib/actions/actionResult.types";

import styles from "./DjForm.module.css";
import type { DjMatchT } from "./djs.types";
import { ExistingDjs } from "./ExistingDjs";
import { SimilarDjs } from "./SimilarDjs";
import { getDjMatchGroups } from "./utils/getDjMatchGroups";

// search_artists returns nothing under 2 characters.
const MIN_NAME_LENGTH = 2;

const CITY_HELP = "Not where you saw them. Check their RA or Instagram if unsure.";

/** A server action the DJ form submits, through `useActionState`. */
export type DjFormActionT = (
  previous: ActionResultT | null,
  formData: FormData
) => Promise<ActionResultT>;

/** What the edit form starts with. The add form starts empty. */
export type DjFormValuesT = {
  name: string;
  city: CityT | null;
  links: Record<string, string>;
};

export type DjFormPropsT = {
  action: DjFormActionT;
  platforms: LinkPlatformT[];
  submitLabel: string;
  initialValues?: DjFormValuesT;
};

/**
 * The DJ form, for adding and editing: name, where they're based, and links. Adding
 * checks for duplicates as the user types (ADR 0011):
 * - DJs with exactly the name, in any city, show above the city field with "Use this DJ"
 *   and "Different person?", and the button becomes "Add as a new DJ". The city is
 *   required when one of them has no city, since the database refuses a second DJ with
 *   the name and no city.
 * - DJs with a similar name, in the picked city or with no city, show below it.
 * Fields keep what was typed when the action refuses the form, and each error shows
 * under its field.
 */
export const DjForm = ({
  action,
  platforms,
  submitLabel,
  initialValues
}: DjFormPropsT): ReactElement => {
  const [result, formAction, isPending] = useActionState(action, null);
  const [name, setName] = useState(initialValues?.name ?? "");
  const [city, setCity] = useState<CityT | null>(initialValues?.city ?? null);
  const [links, setLinks] = useState<Record<string, string>>(initialValues?.links ?? {});
  const failure = result?.ok === false ? result : null;
  const isNew = initialValues === undefined;

  const trimmed = name.trim();
  const searchParams = new URLSearchParams({ q: trimmed });
  if (city) {
    searchParams.set("cityId", String(city.id));
  }
  const searchUrl =
    isNew && [...trimmed].length >= MIN_NAME_LENGTH
      ? `/api/djs/similar?${searchParams.toString()}`
      : null;
  const { results } = useSearchResults<DjMatchT>(searchUrl);
  const { exact, near, isCityRequired } = getDjMatchGroups(results);
  const hasExact = exact.length > 0;

  const cityHelp = isCityRequired
    ? `Needed, because another DJ called ${exact[0].name} has no city. ${CITY_HELP}`
    : `Optional. ${CITY_HELP}`;

  return (
    <form className={styles.wrapper} action={formAction} noValidate>
      <TextField
        label="Name"
        name="name"
        value={name}
        autoComplete="off"
        helpText="As they're billed. For a b2b set, add each DJ on their own."
        errors={failure?.fieldErrors?.name}
        isRequired
        onValueChange={setName}
      />
      {hasExact && <ExistingDjs djs={exact} />}
      <CityPicker
        label="Where they're based"
        name="cityId"
        initialCity={initialValues?.city ?? undefined}
        helpText={cityHelp}
        errors={failure?.fieldErrors?.cityId}
        isRequired={isCityRequired}
        onCityChange={setCity}
      />
      {near.length > 0 && <SimilarDjs djs={near} />}
      <fieldset className={styles.group}>
        <legend className={styles.legend}>Links (optional)</legend>
        {platforms.map((platform) => {
          const fieldName = getLinkFieldName(platform.id);
          return (
            <TextField
              key={platform.id}
              label={platform.label}
              name={fieldName}
              type="url"
              autoComplete="url"
              value={links[platform.id] ?? ""}
              errors={failure?.fieldErrors?.[fieldName]}
              onValueChange={(value) => {
                setLinks({ ...links, [platform.id]: value });
              }}
            />
          );
        })}
      </fieldset>
      <SubmitButton isPending={isPending}>
        {hasExact ? "Add as a new DJ" : submitLabel}
      </SubmitButton>
      {failure && <FormError>{failure.message}</FormError>}
    </form>
  );
};

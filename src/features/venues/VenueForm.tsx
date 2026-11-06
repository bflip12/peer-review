"use client";

import { useActionState, useState } from "react";
import type { ReactElement } from "react";

import { FormError } from "@/features/forms/FormError";
import { SubmitButton } from "@/features/forms/SubmitButton";
import { TextField } from "@/features/forms/TextField";
import type { ActionResultT } from "@/lib/actions/actionResult.types";

import { CityPicker } from "./CityPicker";
import { SimilarVenues } from "./SimilarVenues";
import { getLinkFieldName } from "./utils/getLinkFieldName";
import styles from "./VenueForm.module.css";
import type { CityT, VenueFormOptionsT } from "./venues.types";

/** A server action the venue form submits, through `useActionState`. */
export type VenueFormActionT = (
  previous: ActionResultT | null,
  formData: FormData
) => Promise<ActionResultT>;

/** What the edit form starts with. The add form starts empty. */
export type VenueFormValuesT = {
  name: string;
  city: CityT;
  links: Record<string, string>;
  soundSystemIds: string[];
};

export type VenueFormPropsT = {
  action: VenueFormActionT;
  options: VenueFormOptionsT;
  submitLabel: string;
  initialValues?: VenueFormValuesT;
};

/**
 * The venue form, for adding and editing: name, city, links, and sound systems. Adding
 * shows venues with a similar name in the chosen city before the rest of the form, so a
 * second entry is not made by accident. Fields keep what was typed when the action
 * refuses the form, and each error shows under its field.
 */
export const VenueForm = ({
  action,
  options,
  submitLabel,
  initialValues
}: VenueFormPropsT): ReactElement => {
  const [result, formAction, isPending] = useActionState(action, null);
  const [name, setName] = useState(initialValues?.name ?? "");
  const [city, setCity] = useState<CityT | null>(initialValues?.city ?? null);
  const [links, setLinks] = useState<Record<string, string>>(initialValues?.links ?? {});
  const [soundSystemIds, setSoundSystemIds] = useState(
    new Set(initialValues?.soundSystemIds ?? [])
  );
  const failure = result?.ok === false ? result : null;
  const isNew = initialValues === undefined;

  const handleSoundSystemToggle = (id: string, isChecked: boolean): void => {
    const next = new Set(soundSystemIds);
    if (isChecked) {
      next.add(id);
    } else {
      next.delete(id);
    }
    setSoundSystemIds(next);
  };

  return (
    <form className={styles.wrapper} action={formAction} noValidate>
      <TextField
        label="Name"
        name="name"
        value={name}
        autoComplete="off"
        helpText="As the venue writes it, without the city."
        errors={failure?.fieldErrors?.name}
        isRequired
        onValueChange={setName}
      />
      <CityPicker
        label="City"
        name="cityId"
        initialCity={initialValues?.city}
        errors={failure?.fieldErrors?.cityId}
        onCityChange={setCity}
      />
      {isNew && <SimilarVenues name={name} city={city} />}
      <fieldset className={styles.group}>
        <legend className={styles.legend}>Links (optional)</legend>
        {options.platforms.map((platform) => {
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
      <fieldset className={styles.group} aria-describedby="sound-systems-help">
        <legend className={styles.legend}>Sound system (optional)</legend>
        <p className={styles.help} id="sound-systems-help">
          Pick every brand the venue uses.
        </p>
        <div className={styles.checkboxes}>
          {options.soundSystems.map((soundSystem) => (
            <label className={styles.checkbox} key={soundSystem.id}>
              <input
                type="checkbox"
                name="soundSystemIds"
                value={soundSystem.id}
                checked={soundSystemIds.has(soundSystem.id)}
                onChange={(event) => {
                  handleSoundSystemToggle(soundSystem.id, event.target.checked);
                }}
              />
              {soundSystem.name}
            </label>
          ))}
        </div>
        {failure?.fieldErrors?.soundSystemIds && (
          <p className={styles.error}>{failure.fieldErrors.soundSystemIds.join(" ")}</p>
        )}
      </fieldset>
      <SubmitButton isPending={isPending}>{submitLabel}</SubmitButton>
      {failure && <FormError>{failure.message}</FormError>}
    </form>
  );
};

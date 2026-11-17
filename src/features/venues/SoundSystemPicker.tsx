"use client";

import { useState, useTransition } from "react";
import type { ChangeEvent, KeyboardEvent, ReactElement } from "react";

import { useSearchResults } from "@/features/catalog/hooks/useSearchResults";
import { getNextOptionIndex } from "@/features/catalog/utils/getNextOptionIndex";
import type { ActionResultT } from "@/lib/actions/actionResult.types";

import styles from "./SoundSystemPicker.module.css";
import type { SoundSystemOptionT } from "./utils/getSoundSystemOptions";
import { getSoundSystemOptions } from "./utils/getSoundSystemOptions";
import type { SoundSystemT } from "./venues.types";

/** Adds a brand to the shared list, or returns the listed one with the same name. */
export type AddSoundSystemT = (name: string) => Promise<ActionResultT<SoundSystemT>>;

export type SoundSystemPickerPropsT = {
  label: string;
  name: string;
  addSoundSystem: AddSoundSystemT;
  initialSoundSystems?: SoundSystemT[];
  errors?: string[];
};

/**
 * The venue form's sound system field (ADR 0026): a search over the shared brand list
 * (ARIA combobox with a listbox) and the picked brands as tags above it, each with a
 * remove button. When no listed brand matches, the last row adds the typed name to the
 * list for everyone. Each picked brand's ID is sent in a hidden input named `name`.
 * Arrow keys move through the rows, Enter picks one, and Escape closes the list.
 */
export const SoundSystemPicker = ({
  label,
  name,
  addSoundSystem,
  initialSoundSystems = [],
  errors = []
}: SoundSystemPickerPropsT): ReactElement => {
  const [selected, setSelected] = useState<SoundSystemT[]>(initialSoundSystems);
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [addError, setAddError] = useState<string | null>(null);
  const [isAdding, startAdding] = useTransition();
  const trimmed = query.trim();
  const searchUrl = trimmed
    ? `/api/sound-systems?${new URLSearchParams({ q: trimmed }).toString()}`
    : null;
  const { results, isSearching } = useSearchResults<SoundSystemT>(searchUrl);

  const inputId = `field-${name}`;
  const listId = `${inputId}-list`;
  const helpId = `${inputId}-help`;
  const errorId = `${inputId}-error`;
  // Wait for the search before offering "Add …", so it never shows for a listed brand.
  const options = isSearching ? [] : getSoundSystemOptions({ results, selected, query });
  const isListShown = isOpen && options.length > 0;
  const shownErrors = addError ? [...errors, addError] : errors;
  const hasErrors = shownErrors.length > 0;

  const pickBrand = (brand: SoundSystemT): void => {
    if (!selected.some((picked) => picked.id === brand.id)) {
      setSelected([...selected, brand]);
    }
    setQuery("");
    setIsOpen(false);
    setActiveIndex(-1);
  };

  const pickOption = (option: SoundSystemOptionT): void => {
    setAddError(null);
    if (option.kind === "brand") {
      pickBrand(option.brand);
      return;
    }
    startAdding(async () => {
      const result = await addSoundSystem(option.name);
      if (result.ok) {
        pickBrand(result.data);
      } else {
        setAddError(result.message);
      }
    });
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement>): void => {
    setQuery(event.target.value);
    setIsOpen(true);
    setActiveIndex(-1);
    setAddError(null);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>): void => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      setIsOpen(true);
      setActiveIndex(
        getNextOptionIndex(activeIndex, { count: options.length, key: event.key })
      );
      return;
    }
    if (event.key === "Enter" && trimmed) {
      // Enter picks the highlighted row instead of sending the form.
      event.preventDefault();
      const option = isListShown ? options[activeIndex] : undefined;
      if (option) {
        pickOption(option);
      }
      return;
    }
    if (event.key === "Escape") {
      setIsOpen(false);
      setActiveIndex(-1);
    }
  };

  const activeOption = isListShown ? options[activeIndex] : undefined;
  const getOptionId = (option: SoundSystemOptionT): string =>
    option.kind === "brand" ? `${listId}-${option.brand.id}` : `${listId}-add`;
  const describedBy = [helpId, hasErrors && errorId].filter(Boolean).join(" ");

  return (
    <div className={styles.wrapper}>
      <label className={styles.label} htmlFor={inputId}>
        {label}
      </label>
      {selected.length > 0 && (
        <ul className={styles.tags} aria-label={`${label}: picked`}>
          {selected.map((brand) => (
            <li className={styles.tag} key={brand.id}>
              {brand.name}
              <input type="hidden" name={name} value={brand.id} />
              <button
                className={styles.remove}
                type="button"
                aria-label={`Remove ${brand.name}`}
                onClick={() => {
                  setSelected(selected.filter((picked) => picked.id !== brand.id));
                }}>
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className={styles.field}>
        <input
          className={styles.input}
          id={inputId}
          type="text"
          role="combobox"
          autoComplete="off"
          value={query}
          disabled={isAdding}
          aria-expanded={isListShown}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={activeOption ? getOptionId(activeOption) : undefined}
          aria-invalid={hasErrors || undefined}
          aria-describedby={describedBy}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onBlur={() => {
            setIsOpen(false);
          }}
        />
        <ul
          className={styles.list}
          id={listId}
          role="listbox"
          aria-label={label}
          hidden={!isListShown}>
          {options.map((option, index) => (
            <li
              className={styles.option}
              id={getOptionId(option)}
              key={getOptionId(option)}
              role="option"
              aria-selected={index === activeIndex}
              // Picks on mouse down, before the input's blur closes the list.
              onMouseDown={(event) => {
                event.preventDefault();
                pickOption(option);
              }}>
              {option.kind === "brand" ? option.brand.name : `Add “${option.name}”`}
            </li>
          ))}
        </ul>
      </div>
      <p className={styles.help} id={helpId} aria-live="polite">
        {isAdding
          ? "Adding the sound system…"
          : "Search for a brand. If it is not listed, add it for everyone."}
      </p>
      {hasErrors && (
        <p className={styles.error} id={errorId} role="alert">
          {shownErrors.join(" ")}
        </p>
      )}
    </div>
  );
};

"use client";

import { useState } from "react";
import type { ChangeEvent, KeyboardEvent, ReactElement } from "react";

import styles from "./CityPicker.module.css";
import { useSearchResults } from "./hooks/useSearchResults";
import { getCityLabel } from "./utils/getCityLabel";
import { getNextOptionIndex } from "./utils/getNextOptionIndex";
import type { CityOptionT, CityT } from "./venues.types";

// search_cities returns nothing under 2 characters.
const MIN_QUERY_LENGTH = 2;

export type CityPickerPropsT = {
  label: string;
  name: string;
  initialCity?: CityT;
  errors?: string[];
  onCityChange?: (city: CityT | null) => void;
};

/**
 * A city field that searches the city list as the user types (ARIA combobox with a
 * listbox). The chosen city's ID is sent in a hidden input named `name`; typed text alone
 * sends nothing, so the form cannot save a city that is not in the list. Arrow keys move
 * through the results, Enter picks one, and Escape closes the list.
 */
export const CityPicker = ({
  label,
  name,
  initialCity,
  errors = [],
  onCityChange
}: CityPickerPropsT): ReactElement => {
  const [city, setCity] = useState<CityT | null>(initialCity ?? null);
  const [query, setQuery] = useState(initialCity ? getCityLabel(initialCity).name : "");
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const trimmed = query.trim();
  const searchUrl =
    !city && [...trimmed].length >= MIN_QUERY_LENGTH
      ? `/api/cities?${new URLSearchParams({ q: trimmed }).toString()}`
      : null;
  const { results, isSearching } = useSearchResults<CityOptionT>(searchUrl);

  const inputId = `field-${name}`;
  const listId = `${inputId}-list`;
  const helpId = `${inputId}-help`;
  const errorId = `${inputId}-error`;
  const hasErrors = errors.length > 0;
  const isListShown = isOpen && searchUrl !== null;
  const hasNoResults = isListShown && !isSearching && results.length === 0;

  const pickCity = (option: CityOptionT): void => {
    const picked = {
      id: option.id,
      name: option.name,
      admin1Name: option.admin1Name,
      countryCode: option.countryCode
    };
    setCity(picked);
    setQuery(getCityLabel(option).name);
    setIsOpen(false);
    setActiveIndex(-1);
    onCityChange?.(picked);
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement>): void => {
    setQuery(event.target.value);
    setIsOpen(true);
    setActiveIndex(-1);
    if (city) {
      setCity(null);
      onCityChange?.(null);
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>): void => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      setIsOpen(true);
      setActiveIndex(
        getNextOptionIndex(activeIndex, { count: results.length, key: event.key })
      );
      return;
    }
    if (event.key === "Enter" && isListShown) {
      // Enter picks the highlighted city instead of sending the form.
      event.preventDefault();
      const option = results[activeIndex];
      if (option) {
        pickCity(option);
      }
      return;
    }
    if (event.key === "Escape") {
      setIsOpen(false);
      setActiveIndex(-1);
    }
  };

  const activeOption = isListShown ? results[activeIndex] : undefined;
  const describedBy = [helpId, hasErrors && errorId].filter(Boolean).join(" ");

  return (
    <div className={styles.wrapper}>
      <label className={styles.label} htmlFor={inputId}>
        {label}
      </label>
      <div className={styles.field}>
        <input
          className={styles.input}
          id={inputId}
          type="text"
          role="combobox"
          autoComplete="off"
          value={query}
          aria-expanded={isListShown}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={
            activeOption ? `${listId}-${activeOption.id}` : undefined
          }
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
          {results.map((option, index) => {
            const { name: cityName, region } = getCityLabel(option);
            return (
              <li
                className={styles.option}
                id={`${listId}-${option.id}`}
                key={option.id}
                role="option"
                aria-selected={index === activeIndex}
                // Picks on mouse down, before the input's blur closes the list.
                onMouseDown={(event) => {
                  event.preventDefault();
                  pickCity(option);
                }}>
                <span>{cityName}</span> <span className={styles.region}>{region}</span>
              </li>
            );
          })}
        </ul>
      </div>
      <input type="hidden" name={name} value={city?.id ?? ""} />
      <p className={styles.help} id={helpId} aria-live="polite">
        {hasNoResults
          ? "No city matches. Check the spelling, or try the name in English."
          : "Type at least 2 letters, then pick the city from the list."}
      </p>
      {hasErrors && (
        <p className={styles.error} id={errorId}>
          {errors.join(" ")}
        </p>
      )}
    </div>
  );
};

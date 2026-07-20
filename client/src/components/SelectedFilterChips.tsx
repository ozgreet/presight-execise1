type SelectedFilterChipsProps = {
  hobbies: string[];
  nationalities: string[];
  onClear: () => void;
  onRemoveHobby: (hobby: string) => void;
  onRemoveNationality: (nationality: string) => void;
};

export function SelectedFilterChips({
  hobbies,
  nationalities,
  onClear,
  onRemoveHobby,
  onRemoveNationality,
}: SelectedFilterChipsProps) {
  const hasFilters = hobbies.length > 0 || nationalities.length > 0;

  if (!hasFilters) {
    return null;
  }

  return (
    <section aria-label="Selected filters" className="selected-filters">
      <div className="selected-filters__chips">
        {hobbies.map((hobby) => (
          <button
            aria-label={`Remove hobby ${hobby}`}
            className="filter-chip"
            key={`hobby-${hobby}`}
            onClick={() => onRemoveHobby(hobby)}
            title={`Remove hobby ${hobby}`}
            type="button"
          >
            <span>{hobby}</span>
            <span aria-hidden="true">×</span>
          </button>
        ))}
        {nationalities.map((nationality) => (
          <button
            aria-label={`Remove nationality ${nationality}`}
            className="filter-chip"
            key={`nationality-${nationality}`}
            onClick={() => onRemoveNationality(nationality)}
            title={`Remove nationality ${nationality}`}
            type="button"
          >
            <span>{nationality}</span>
            <span aria-hidden="true">×</span>
          </button>
        ))}
      </div>
      <button className="clear-filters" onClick={onClear} type="button">
        Clear all
      </button>
    </section>
  );
}

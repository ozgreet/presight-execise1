import {
  sortDirections,
  sortFields,
  type SortDirection,
  type SortField,
} from '../directory/directory-state';

type SortControlsProps = {
  direction: SortDirection;
  onDirectionChange: (direction: SortDirection) => void;
  onFieldChange: (field: SortField) => void;
  field: SortField;
};

const fieldOptions: Array<{ label: string; value: SortField }> = [
  { value: 'first_name', label: 'First name' },
  { value: 'last_name', label: 'Last name' },
  { value: 'age', label: 'Age' },
  { value: 'nationality', label: 'Nationality' },
];

const directionOptions: Array<{
  label: string;
  value: SortDirection;
}> = [
  { value: 'asc', label: 'Ascending' },
  { value: 'desc', label: 'Descending' },
];

export function SortControls({
  direction,
  field,
  onDirectionChange,
  onFieldChange,
}: SortControlsProps) {
  return (
    <div aria-label="Sort users" className="sort-controls" role="group">
      <label>
        <span>Sort by</span>
        <select
          aria-label="Sort field"
          onChange={(event) => {
            const value = sortFields.find(
              (option) => option === event.target.value,
            );

            if (value) {
              onFieldChange(value);
            }
          }}
          value={field}
        >
          {fieldOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span>Direction</span>
        <select
          aria-label="Sort direction"
          onChange={(event) => {
            const value = sortDirections.find(
              (option) => option === event.target.value,
            );

            if (value) {
              onDirectionChange(value);
            }
          }}
          value={direction}
        >
          {directionOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}

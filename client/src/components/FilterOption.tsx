type FilterOptionProps = {
  checked: boolean;
  count: number;
  name: string;
  onChange: () => void;
};

export function FilterOption({
  checked,
  count,
  name,
  onChange,
}: FilterOptionProps) {
  return (
    <label className="filter-option">
      <span className="filter-option__label">
        <input checked={checked} onChange={onChange} type="checkbox" />
        <span title={name}>{name}</span>
      </span>
      <span
        aria-label={`${count} matching users`}
        className="filter-option__count"
      >
        {count}
      </span>
    </label>
  );
}

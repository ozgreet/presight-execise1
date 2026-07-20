import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { SortControls } from './SortControls';

describe('SortControls', () => {
  it('changes the sort field', () => {
    const onFieldChange = vi.fn();

    render(
      <SortControls
        direction="asc"
        field="last_name"
        onDirectionChange={vi.fn()}
        onFieldChange={onFieldChange}
      />,
    );

    fireEvent.change(screen.getByLabelText('Sort field'), {
      target: { value: 'age' },
    });

    expect(onFieldChange).toHaveBeenCalledWith('age');
  });

  it('changes the sort direction', () => {
    const onDirectionChange = vi.fn();

    render(
      <SortControls
        direction="asc"
        field="last_name"
        onDirectionChange={onDirectionChange}
        onFieldChange={vi.fn()}
      />,
    );

    fireEvent.change(screen.getByLabelText('Sort direction'), {
      target: { value: 'desc' },
    });

    expect(onDirectionChange).toHaveBeenCalledWith('desc');
  });
});

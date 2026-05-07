import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EmojiPickerDialog } from './EmojiPicker';

describe('EmojiPickerDialog', () => {
  it('finds bundled asset icons by keyword and returns asset:<id> on select', () => {
    const onSelect = vi.fn();
    const onClose = vi.fn();

    const { container } = render(
      <EmojiPickerDialog selectedEmoji="" onSelect={onSelect} onClose={onClose} />,
    );

    const input = screen.getByPlaceholderText('חיפוש אימוג׳י...');
    fireEvent.change(input, { target: { value: 'chlorine' } });

    const img = container.querySelector('img');
    expect(img).not.toBeNull();

    if (!img) throw new Error('Expected asset icon image to be rendered');

    fireEvent.click(img.closest('button')!);

    expect(onSelect).toHaveBeenCalledWith('asset:spray_bottle');
    expect(onClose).toHaveBeenCalled();
  });
});


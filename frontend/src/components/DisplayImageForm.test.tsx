import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DisplayImageForm, type DisplayImageType } from './DisplayImageForm';
import { createRef, useState } from 'react';

/** Wrapper that manages DisplayImageForm state like a real parent component */
function TestHarness({ initialIconId = 'dairy', initialDisplayType = 'icon' as DisplayImageType }) {
  const [displayType, setDisplayType] = useState<DisplayImageType>(initialDisplayType);
  const [iconId, setIconId] = useState(initialIconId);
  const [imageUrl, setImageUrl] = useState('');
  const fileInputRef = createRef<HTMLInputElement>();
  return (
    <>
      <DisplayImageForm
        displayType={displayType}
        iconId={iconId}
        imageUrl={imageUrl}
        onDisplayTypeChange={setDisplayType}
        onIconIdChange={setIconId}
        onImageUrlChange={setImageUrl}
        fileInputRef={fileInputRef}
      />
      {/* Expose state for assertions */}
      <span data-testid="state-iconId">{iconId}</span>
      <span data-testid="state-imageUrl">{imageUrl}</span>
      <span data-testid="state-displayType">{displayType}</span>
      <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={() => {}} />
    </>
  );
}

/** Get the display-type dropdown (the one with icon/device/link/web options) */
function getTypeDropdown() {
  // The type dropdown contains the 'אייקון' option
  return screen.getByDisplayValue('אייקון');
}

describe('DisplayImageForm', () => {
  it('preserves iconId when switching from icon to web and back', async () => {
    const user = userEvent.setup();
    render(<TestHarness initialIconId="dairy" />);

    // Start in icon mode with 'dairy' selected
    expect(screen.getByTestId('state-iconId')).toHaveTextContent('dairy');

    // Switch to web search
    const dropdown = getTypeDropdown();
    await user.selectOptions(dropdown, 'web');
    expect(screen.getByTestId('state-displayType')).toHaveTextContent('web');

    // iconId should still be 'dairy' — not cleared
    expect(screen.getByTestId('state-iconId')).toHaveTextContent('dairy');

    // Switch back to icon
    await user.selectOptions(dropdown, 'icon');
    expect(screen.getByTestId('state-displayType')).toHaveTextContent('icon');

    // iconId should still be 'dairy'
    expect(screen.getByTestId('state-iconId')).toHaveTextContent('dairy');
  });

  it('preserves iconId when switching from icon to link and back', async () => {
    const user = userEvent.setup();
    render(<TestHarness initialIconId="bread" />);

    const dropdown = getTypeDropdown();

    // Switch to link
    await user.selectOptions(dropdown, 'link');
    expect(screen.getByTestId('state-iconId')).toHaveTextContent('bread');

    // Switch back to icon
    await user.selectOptions(dropdown, 'icon');
    expect(screen.getByTestId('state-iconId')).toHaveTextContent('bread');
  });

  it('clears imageUrl when switching back to icon', async () => {
    const user = userEvent.setup();
    render(<TestHarness initialIconId="cheese" />);

    const dropdown = getTypeDropdown();

    // Switch to link and set a URL
    await user.selectOptions(dropdown, 'link');
    const urlInput = screen.getByPlaceholderText('https://...');
    await user.type(urlInput, 'https://example.com/photo.jpg');
    expect(screen.getByTestId('state-imageUrl')).toHaveTextContent('https://example.com/photo.jpg');

    // Switch back to icon — imageUrl should be cleared
    await user.selectOptions(dropdown, 'icon');
    expect(screen.getByTestId('state-imageUrl')).toHaveTextContent('');

    // But iconId should still be there
    expect(screen.getByTestId('state-iconId')).toHaveTextContent('cheese');
  });

  it('preserves iconId through multiple mode switches', async () => {
    const user = userEvent.setup();
    render(<TestHarness initialIconId="tomato" />);

    const dropdown = getTypeDropdown();

    // icon -> web -> link -> icon
    await user.selectOptions(dropdown, 'web');
    await user.selectOptions(dropdown, 'link');
    await user.selectOptions(dropdown, 'icon');

    expect(screen.getByTestId('state-iconId')).toHaveTextContent('tomato');
  });

  it('shows icon selector only in icon mode', async () => {
    const user = userEvent.setup();
    render(<TestHarness initialIconId="dairy" />);

    // Icon selector visible in icon mode
    expect(screen.getByText('בחירת אייקון')).toBeInTheDocument();

    // Switch to web — icon selector hidden
    const dropdown = getTypeDropdown();
    await user.selectOptions(dropdown, 'web');
    expect(screen.queryByText('בחירת אייקון')).not.toBeInTheDocument();

    // Switch back — icon selector visible again with value preserved
    await user.selectOptions(dropdown, 'icon');
    expect(screen.getByText('בחירת אייקון')).toBeInTheDocument();
    expect(screen.getByTestId('state-iconId')).toHaveTextContent('dairy');
  });
});

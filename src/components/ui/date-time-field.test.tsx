import '@/lib/i18n';
import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { fireEvent, render } from '@testing-library/react-native';
import { DateTimeField, openAndroidDateTimePicker } from './date-time-field';

jest.mock('@react-native-community/datetimepicker', () => ({
  __esModule: true,
  default: () => null,
  DateTimePickerAndroid: { open: jest.fn(), dismiss: jest.fn() },
}));

describe('DateTimeField', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('opens date then time and emits the combined local date and time', () => {
    const onChange = jest.fn();
    openAndroidDateTimePicker({
      value: new Date(2026, 7, 1, 9, 0),
      onChange,
    });
    const open = DateTimePickerAndroid.open as jest.Mock;
    const dateOptions = open.mock.calls[0]?.[0] as {
      mode: string;
      onValueChange: (event: unknown, date: Date) => void;
    };
    expect(dateOptions.mode).toBe('date');
    dateOptions.onValueChange({}, new Date(2026, 7, 2, 9, 0));

    const timeOptions = open.mock.calls[1]?.[0] as {
      mode: string;
      onValueChange: (event: unknown, date: Date) => void;
    };
    expect(timeOptions.mode).toBe('time');
    timeOptions.onValueChange({}, new Date(2026, 7, 2, 14, 30));

    const emitted = onChange.mock.calls[0]?.[0] as Date;
    expect(emitted.getFullYear()).toBe(2026);
    expect(emitted.getMonth()).toBe(7);
    expect(emitted.getDate()).toBe(2);
    expect(emitted.getHours()).toBe(14);
    expect(emitted.getMinutes()).toBe(30);
  });

  it('clears an optional end date explicitly', async () => {
    const onChangeText = jest.fn();
    const screen = await render(
      <DateTimeField
        label="Bitiş"
        value="2026-08-01T10:00:00.000Z"
        onChangeText={onChangeText}
        optional
      />,
    );
    fireEvent.press(screen.getByRole('button', { name: 'Temizle' }));
    expect(onChangeText).toHaveBeenCalledWith('');
  });
});

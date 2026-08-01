import { render } from '@testing-library/react-native';
import { i18n } from '@/lib/i18n';
import { PrivacyScreen } from './privacy-screen';

describe('PrivacyScreen', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('tr');
  });

  it('renders the localized policy and the main data-handling sections', async () => {
    const screen = await render(<PrivacyScreen />);

    expect(screen.getByText('Gizlilik Politikası')).toBeTruthy();
    expect(screen.getByText('Topladığımız veriler')).toBeTruthy();
    expect(screen.getByText('Demo modu')).toBeTruthy();
    expect(screen.getByText('Saklama süresi ve silme')).toBeTruthy();
    expect(screen.getByText('İletişim')).toBeTruthy();
  });
});

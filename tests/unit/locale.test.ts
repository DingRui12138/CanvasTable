import { resolveLocale } from '@/locale';

describe('locale', () => {
  it('uses zh-CN by default', () => {
    expect(resolveLocale().contextMenu.pinTop).toBe('固定到顶部');
  });

  it('supports en-US preset', () => {
    expect(resolveLocale('en-US').contextMenu.pinTop).toBe('Pin to top');
    expect(resolveLocale('en-US').filter.confirm).toBe('OK');
  });

  it('deep merges user overrides', () => {
    const locale = resolveLocale({
      preset: 'en-US',
      messages: {
        filter: {
          confirm: 'Apply',
        },
      },
    });

    expect(locale.contextMenu.pinTop).toBe('Pin to top');
    expect(locale.filter.confirm).toBe('Apply');
  });

  it('supports calendar array overrides without mutating presets', () => {
    const locale = resolveLocale({
      messages: {
        calendar: {
          weekdays: ['S', 'M', 'T', 'W', 'T', 'F', 'S'],
        },
      },
    });

    expect(locale.calendar.weekdays[0]).toBe('S');
    expect(resolveLocale().calendar.weekdays[0]).toBe('日');
  });
});

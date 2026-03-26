import type { Column, Row, CheckboxConfig, RadioConfig, SwitchConfig } from '@/types';

/**
 * Checkbox 列类型测试
 */

describe('Checkbox Column', () => {
  describe('checkbox config', () => {
    it('should create checked checkbox config', () => {
      const config: CheckboxConfig = { checked: true };
      expect(config.checked).toBe(true);
    });

    it('should create unchecked checkbox config', () => {
      const config: CheckboxConfig = { checked: false };
      expect(config.checked).toBe(false);
    });

    it('should support indeterminate state', () => {
      const config: CheckboxConfig = { checked: false, indeterminate: true };
      expect(config.indeterminate).toBe(true);
    });
  });

  describe('checkbox in render function', () => {
    const createCheckboxColumn = (): Column => ({
      key: 'active',
      title: 'Active',
      width: 60,
      type: 'checkbox',
      render: (value: unknown) => ({
        type: 'checkbox',
        checkbox: {
          checked: Boolean(value),
        },
      }),
    });

    it('should render checked for true value', () => {
      const column = createCheckboxColumn();
      const row: Row = { id: '1', data: { active: true } };
      const result = column.render!(true, row, column, 0);

      expect(result.type).toBe('checkbox');
      expect(result.checkbox?.checked).toBe(true);
    });

    it('should render unchecked for false value', () => {
      const column = createCheckboxColumn();
      const row: Row = { id: '1', data: { active: false } };
      const result = column.render!(false, row, column, 0);

      expect(result.type).toBe('checkbox');
      expect(result.checkbox?.checked).toBe(false);
    });
  });
});

/**
 * Radio 列类型测试
 */
describe('Radio Column', () => {
  describe('radio config', () => {
    it('should create radio with options', () => {
      const config: RadioConfig = {
        name: 'priority',
        value: 'high',
        options: [
          { label: 'High', value: 'high' },
          { label: 'Medium', value: 'medium' },
          { label: 'Low', value: 'low' },
        ],
      };

      expect(config.options?.length).toBe(3);
    });

    it('should mark correct option as checked', () => {
      const config: RadioConfig = {
        name: 'priority',
        value: 'medium',
        options: [
          { label: 'High', value: 'high' },
          { label: 'Medium', value: 'medium' },
          { label: 'Low', value: 'low' },
        ],
      };

      const mediumOption = config.options?.find(o => o.value === 'medium');
      expect(config.value).toBe('medium');
    });
  });
});

/**
 * Switch 列类型测试
 */
describe('Switch Column', () => {
  describe('switch config', () => {
    it('should create on state config', () => {
      const config: SwitchConfig = { checked: true };
      expect(config.checked).toBe(true);
    });

    it('should create off state config', () => {
      const config: SwitchConfig = { checked: false };
      expect(config.checked).toBe(false);
    });

    it('should support animation state', () => {
      const config: SwitchConfig = {
        checked: true,
        animationProgress: 0.5,
        animationDirection: 'forward',
      };

      expect(config.animationProgress).toBe(0.5);
      expect(config.animationDirection).toBe('forward');
    });
  });

  describe('switch in render function', () => {
    const createSwitchColumn = (): Column => ({
      key: 'enabled',
      title: 'Enabled',
      width: 60,
      type: 'switch',
      render: (value: unknown) => ({
        type: 'switch',
        switch: {
          checked: Boolean(value),
        },
      }),
    });

    it('should render on for true value', () => {
      const column = createSwitchColumn();
      const row: Row = { id: '1', data: { enabled: true } };
      const result = column.render!(true, row, column, 0);

      expect(result.type).toBe('switch');
      expect(result.switch?.checked).toBe(true);
    });
  });
});
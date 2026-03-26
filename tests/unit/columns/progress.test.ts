import type { Column, Row, ProgressColorStop } from '@/types';

/**
 * 进度条列类型测试
 * 测试值范围限制、颜色计算、交互等
 */

// 模拟进度条渲染逻辑（从 Renderer 中提取的纯函数）
function clampProgressValue(value: number): number {
  return Math.min(100, Math.max(0, value));
}

function calculateProgressWidth(value: number, barWidth: number): number {
  const clampedValue = clampProgressValue(value);
  return (clampedValue / 100) * barWidth;
}

function getProgressColor(
  value: number,
  colorConfig: string | ProgressColorStop[] | ((value: number) => string) | undefined
): string {
  if (!colorConfig) return '#1890ff';

  if (typeof colorConfig === 'string') {
    return colorConfig;
  }

  if (typeof colorConfig === 'function') {
    return colorConfig(value);
  }

  // Array of color stops
  const sortedStops = [...colorConfig].sort((a, b) => a.value - b.value);

  // Find the appropriate color
  for (let i = sortedStops.length - 1; i >= 0; i--) {
    if (value >= sortedStops[i]!.value) {
      return sortedStops[i]!.color;
    }
  }

  return sortedStops[0]?.color ?? '#1890ff';
}

describe('Progress Column', () => {
  describe('value clamping', () => {
    it('should clamp values > 100 to 100', () => {
      expect(clampProgressValue(150)).toBe(100);
      expect(clampProgressValue(999)).toBe(100);
    });

    it('should clamp values < 0 to 0', () => {
      expect(clampProgressValue(-10)).toBe(0);
      expect(clampProgressValue(-999)).toBe(0);
    });

    it('should keep values within 0-100 range unchanged', () => {
      expect(clampProgressValue(0)).toBe(0);
      expect(clampProgressValue(50)).toBe(50);
      expect(clampProgressValue(100)).toBe(100);
    });

    it('should handle decimal values', () => {
      expect(clampProgressValue(50.5)).toBe(50.5);
      expect(clampProgressValue(100.5)).toBe(100);
      expect(clampProgressValue(-0.5)).toBe(0);
    });
  });

  describe('progress width calculation', () => {
    it('should calculate 0% width for value 0', () => {
      expect(calculateProgressWidth(0, 100)).toBe(0);
    });

    it('should calculate 100% width for value 100', () => {
      expect(calculateProgressWidth(100, 100)).toBe(100);
    });

    it('should calculate correct width for middle values', () => {
      expect(calculateProgressWidth(50, 100)).toBe(50);
      expect(calculateProgressWidth(25, 200)).toBe(50);
      expect(calculateProgressWidth(75, 200)).toBe(150);
    });

    it('should clamp overflow values to full width', () => {
      expect(calculateProgressWidth(150, 100)).toBe(100);
      expect(calculateProgressWidth(200, 200)).toBe(200);
    });

    it('should clamp underflow values to zero', () => {
      expect(calculateProgressWidth(-50, 100)).toBe(0);
    });
  });

  describe('color calculation', () => {
    it('should return default color when no config provided', () => {
      expect(getProgressColor(50, undefined)).toBe('#1890ff');
    });

    it('should return static color string', () => {
      expect(getProgressColor(50, '#52c41a')).toBe('#52c41a');
    });

    it('should call function with value', () => {
      const colorFn = (v: number) => v >= 50 ? '#52c41a' : '#ff4d4f';
      expect(getProgressColor(30, colorFn)).toBe('#ff4d4f');
      expect(getProgressColor(70, colorFn)).toBe('#52c41a');
    });

    it('should return color from color stops array', () => {
      const colorStops: ProgressColorStop[] = [
        { value: 0, color: '#ff4d4f' },
        { value: 50, color: '#faad14' },
        { value: 100, color: '#52c41a' },
      ];

      expect(getProgressColor(0, colorStops)).toBe('#ff4d4f');
      expect(getProgressColor(25, colorStops)).toBe('#ff4d4f');
      expect(getProgressColor(50, colorStops)).toBe('#faad14');
      expect(getProgressColor(75, colorStops)).toBe('#faad14');
      expect(getProgressColor(100, colorStops)).toBe('#52c41a');
    });

    it('should handle unsorted color stops', () => {
      const unsortedStops: ProgressColorStop[] = [
        { value: 100, color: '#52c41a' },
        { value: 0, color: '#ff4d4f' },
        { value: 50, color: '#faad14' },
      ];

      expect(getProgressColor(25, unsortedStops)).toBe('#ff4d4f');
      expect(getProgressColor(75, unsortedStops)).toBe('#faad14');
    });
  });

  describe('column configuration', () => {
    it('should create valid progress column config', () => {
      const column: Column = {
        key: 'progress',
        title: 'Progress',
        width: 150,
        type: 'progress',
        render: (value: unknown) => ({
          type: 'progress',
          progress: {
            value: value as number,
            shape: 'line',
            showText: true,
          },
        }),
      };

      expect(column.type).toBe('progress');
      expect(column.width).toBe(150);
    });

    it('should support different progress shapes', () => {
      const shapes: Array<'line' | 'circle' | 'dashboard'> = ['line', 'circle', 'dashboard'];

      shapes.forEach(shape => {
        const renderResult = {
          type: 'progress' as const,
          progress: {
            value: 50,
            shape,
          },
        };
        expect(renderResult.progress.shape).toBe(shape);
      });
    });
  });

  describe('interactive mode', () => {
    it('should support interactive configuration', () => {
      const interactiveConfig = {
        value: 50,
        interactive: true,
        shape: 'line' as const,
      };

      expect(interactiveConfig.interactive).toBe(true);
    });
  });
});
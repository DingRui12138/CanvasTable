import { defineConfig, devices } from '@playwright/test';

// 观察模式：单线程、慢动作、显示浏览器
// 非观察模式：多线程、快速执行、无头模式
const isWatchMode = process.env.E2E_WATCH === 'true';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: isWatchMode ? 1 : 5,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    headless: !isWatchMode,
    actionTimeout: isWatchMode ? 5000 : 1000,
    launchOptions: {
      slowMo: isWatchMode ? 500 : 0,
    },
  },
  projects: [
    {
      name: 'chrome',
      use: {
        ...devices['Desktop Chrome'],
        channel: 'chrome',  // 使用系统安装的 Chrome
      },
    },
  ],
  // 开发时手动启动 dev server，CI 时自动启动
  webServer: process.env.CI ? {
    command: 'pnpm dev',
    url: 'http://localhost:3000',
    timeout: 120 * 1000,
  } : undefined,
});
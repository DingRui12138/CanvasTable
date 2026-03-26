import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,  // 单线程执行，方便观察
  reporter: 'list',  // 终端输出详细日志
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    headless: false,  // 显示浏览器窗口
    actionTimeout: 5000,  // 每个操作超时
    launchOptions: {
      slowMo: 500,  // 每个操作间隔 500ms，方便观察
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
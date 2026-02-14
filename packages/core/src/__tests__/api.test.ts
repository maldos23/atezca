import { azSetup, azTest, azWait, getState, clearState, setup, test, wait } from '../index.js';

describe('API (index.ts)', () => {
  beforeEach(() => {
    clearState();
  });

  it('setup requires url', () => {
    expect(() => setup({} as any)).toThrow(/requires a url/i);
  });

  it('setup applies defaults and stores config', () => {
    setup({ url: 'https://example.com' });

    const { config, commands } = getState();
    expect(config).toBeTruthy();
    expect(commands).toEqual([]);
    expect(config).toMatchObject({
      url: 'https://example.com',
      browser: 'chromium',
      headless: true,
      timeout: 30000,
      outputDir: 'generated-tests',
      cacheEnabled: true,
      retries: 3,
      disableSSL: false,
    });
  });

  it('test() requires setup() first', () => {
    expect(() => test('interact', 'click login')).toThrow(/must be called before az\.test/i);
  });

  it('test() validates description and action type', () => {
    setup({ url: 'https://example.com' });

    expect(() => test('interact', '   ')).toThrow(/requires a description/i);
    expect(() => test('nope' as any, 'x')).toThrow(/invalid action type/i);
  });

  it('test() trims description and stores command', () => {
    setup({ url: 'https://example.com' });
    test('interact', '  click login  ');

    const { commands } = getState();
    expect(commands).toHaveLength(1);
    expect(commands[0]).toMatchObject({
      actionType: 'interact',
      description: 'click login',
    });
    expect(typeof commands[0]!.timestamp).toBe('number');
  });

  it('wait() adds a wait command', () => {
    setup({ url: 'https://example.com' });
    wait(1234);

    const { commands } = getState();
    expect(commands).toHaveLength(1);
    expect(commands[0]).toMatchObject({
      actionType: 'wait',
      description: 'wait 1234ms',
    });
  });

  it('wait() validates inputs', () => {
    setup({ url: 'https://example.com' });
    expect(() => wait(-1)).toThrow(/positive number/i);
    expect(() => wait('1' as any)).toThrow(/positive number/i);
  });

  it('named exports are wired', () => {
    expect(azSetup).toBe(setup);
    expect(azTest).toBe(test);
    expect(azWait).toBe(wait);

    // Also ensure the main object is present via import side-effect
    // (Smoke test that module evaluation succeeded)
    expect(typeof azSetup).toBe('function');
  });
});

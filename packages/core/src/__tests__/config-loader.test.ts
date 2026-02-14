import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import { ConfigLoader, getConfig, resetConfig } from '../config/config-loader.js';

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'atezca-config-'));
}

describe('ConfigLoader', () => {
  const envBackup = { ...process.env };

  afterEach(() => {
    process.env = { ...envBackup };
    resetConfig();
    vi.restoreAllMocks();
  });

  it('throws if provider is claude and ANTHROPIC_API_KEY is missing', () => {
    delete process.env.ANTHROPIC_API_KEY;
    delete process.env.GOOGLE_API_KEY;
    process.env.ATEZCA_AI_PROVIDER = 'claude';

    expect(() => new ConfigLoader()).toThrow(/configuration validation failed/i);
  });

  it('loads config from env and applies defaults', () => {
    process.env.ATEZCA_AI_PROVIDER = 'claude';
    process.env.ANTHROPIC_API_KEY = 'k';
    process.env.ATEZCA_HEADLESS = '0';
    process.env.ATEZCA_RETRIES = '5';

    const loader = new ConfigLoader();
    const cfg = loader.getConfig();

    expect(cfg.aiProvider).toBe('claude');
    expect(cfg.anthropicApiKey).toBe('k');
    expect(cfg.browser.headless).toBe(false);
    expect(cfg.execution.retries).toBe(5);
  });

  it('loads .atezcarc from cwd and env overrides file', () => {
    const dir = makeTempDir();
    const filePath = path.join(dir, '.atezcarc');
    fs.writeFileSync(
      filePath,
      JSON.stringify(
        {
          aiProvider: 'gemini',
          googleApiKey: 'file-key',
          headless: false,
          retries: 9,
          outputDir: 'out-from-file',
        },
        null,
        2
      ),
      'utf-8'
    );

    process.env.ATEZCA_AI_PROVIDER = 'gemini';
    process.env.GOOGLE_API_KEY = 'env-key';
    process.env.ATEZCA_OUTPUT_DIR = 'out-from-env';

    const cwdSpy = vi.spyOn(process, 'cwd').mockReturnValue(dir);

    const loader = new ConfigLoader();
    const cfg = loader.getConfig();

    expect(cfg.aiProvider).toBe('gemini');
    expect(cfg.googleApiKey).toBe('env-key');
    expect(cfg.execution.outputDir).toBe('out-from-env');
    expect(cfg.execution.retries).toBe(9);

    cwdSpy.mockRestore();

    fs.rmSync(dir, { recursive: true, force: true });
  });

  it('createDefaultConfig writes a file', () => {
    const dir = makeTempDir();
    const filePath = path.join(dir, '.atezcarc');
    process.env.ANTHROPIC_API_KEY = 'k';

    ConfigLoader.createDefaultConfig(filePath);
    const raw = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    expect(raw).toMatchObject({
      aiProvider: 'claude',
      cacheEnabled: true,
      retries: 3,
      outputDir: 'generated-tests',
    });

    fs.rmSync(dir, { recursive: true, force: true });
  });

  it('getConfig caches a global instance and resetConfig clears it', () => {
    process.env.ATEZCA_AI_PROVIDER = 'claude';
    process.env.ANTHROPIC_API_KEY = 'k';

    const a = getConfig();
    const b = getConfig();
    expect(a).toBe(b);

    resetConfig();
    const c = getConfig();
    expect(c).not.toBe(a);
  });
});

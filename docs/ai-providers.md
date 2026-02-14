# AI Provider Comparison

Atezca supports multiple AI providers for interpreting natural language test commands.

## Supported Providers

### Claude (Anthropic) - Default
- **Model**: Claude 3.5 Sonnet
- **Pros**:
  - Excellent for structured tasks
  - Very consistent responses
  - Large context window
  - High quality interpretations
- **Cons**:
  - Requires Anthropic API key
  - Cost: ~$0.003 per command
- **Setup**:
  ```bash
  ANTHROPIC_API_KEY=sk-ant-api03-...
  ATEZCA_AI_PROVIDER=claude
  ```

### Gemini (Google)
- **Model**: Gemini 1.5 Flash (default) / Gemini 1.5 Pro
- **Pros**:
  - Fast and cost-effective
  - Good for most test scenarios
  - Large context window
  - Lower cost than Claude
- **Cons**:
  - Requires Google API key
  - Slightly less consistent than Claude
- **Setup**:
  ```bash
  GOOGLE_API_KEY=AIza...
  ATEZCA_AI_PROVIDER=gemini
  ```

## Getting API Keys

### Claude (Anthropic)
1. Go to: https://console.anthropic.com/
2. Sign up or log in
3. Navigate to API Keys
4. Create a new key
5. Copy key starting with `sk-ant-api03-...`

### Gemini (Google)
1. Go to: https://makersuite.google.com/app/apikey
2. Sign in with Google account
3. Click "Create API Key"
4. Copy key starting with `AIza...`

## Switching Providers

### Via Environment Variables
```bash
# Switch to Gemini
export ATEZCA_AI_PROVIDER=gemini
export GOOGLE_API_KEY=AIza...

# Switch to Claude
export ATEZCA_AI_PROVIDER=claude
export ANTHROPIC_API_KEY=sk-ant-api03-...
```

### Via Config File
Edit `.atezcarc`:
```json
{
  "aiProvider": "gemini",
  "googleApiKey": "AIza...",
  "anthropicApiKey": "sk-ant-api03-..."
}
```

## Cost Comparison

Based on average test command interpretation:

| Provider | Model | Cost per 1K tokens | Avg. Cost per Command | Monthly (100 tests) |
|----------|-------|-------------------|----------------------|-------------------|
| Claude | Sonnet 3.5 | $0.003 input / $0.015 output | ~$0.004 | ~$0.40 |
| Gemini | Flash 1.5 | $0.00015 input / $0.0006 output | ~$0.0002 | ~$0.02 |
| Gemini | Pro 1.5 | $0.0035 input / $0.0105 output | ~$0.003 | ~$0.30 |

**Note**: With caching enabled (default), costs are reduced by ~80% for repeated test runs.

## Performance Comparison

| Metric | Claude Sonnet 3.5 | Gemini Flash 1.5 | Gemini Pro 1.5 |
|--------|------------------|------------------|----------------|
| Latency | ~1-2s | ~0.5-1s | ~1-1.5s |
| Accuracy | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| Consistency | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| Cost-effective | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |

## Recommendations

### Use Claude when:
- ✅ You need maximum accuracy and consistency
- ✅ Working on complex test scenarios
- ✅ Quality is more important than cost
- ✅ Your tests have complex selectors or conditions

### Use Gemini Flash when:
- ✅ You want the most cost-effective option
- ✅ Running many tests frequently
- ✅ Working with straightforward test scenarios
- ✅ Speed is a priority

### Use Gemini Pro when:
- ✅ You want a balance between cost and quality
- ✅ Need better accuracy than Flash but lower cost than Claude
- ✅ Working on moderately complex test scenarios

## Cache Strategy

Regardless of provider, Atezca caches all interpretations for 30 days (configurable). This means:

1. **First run**: Calls AI API (costs apply)
2. **Subsequent runs**: Uses cache (no cost, instant)
3. **Cost savings**: ~80% reduction over 30 days

Example cost with cache (100 test commands/month):
- **Without cache**: $0.40 (Claude) or $0.02 (Gemini)
- **With cache** (assuming 80% cache hit rate): $0.08 (Claude) or $0.004 (Gemini)

## Advanced: Using Different Models

### Gemini Pro (instead of Flash)
Currently not configurable, but you can modify `src/interpreter/gemini-client.ts`:
```typescript
constructor(apiKey: string, model: string = 'gemini-3-pro-preview') {
  // ... rest of code
}
```

### Claude Opus (instead of Sonnet)
Modify `src/interpreter/claude-client.ts`:
```typescript
constructor(apiKey: string, model: string = 'claude-3-opus-20240229') {
  // ... rest of code
}
```

## Future Providers

Planned support for:
- [ ] OpenAI GPT-4/GPT-3.5
- [ ] Local models (Ollama, LLaMA)
- [ ] Azure OpenAI
- [ ] Custom endpoints

## Troubleshooting

### "Invalid API key" error
- Check that your API key is correct
- Verify the provider matches the key (Claude keys start with `sk-ant-`, Gemini keys start with `AIza`)
- Ensure environment variables are set correctly

### Poor interpretation quality
- Try switching providers
- Check your prompts are clear and specific
- Clear cache: `az cache clear`
- Consider using Claude for better accuracy

### High costs
- Switch to Gemini Flash for lower costs
- Enable caching (default)
- Review and optimize your test commands
- Consider running tests less frequently in development

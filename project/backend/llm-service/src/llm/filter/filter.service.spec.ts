import { detectSensitiveWords, redactSensitiveText } from './filter.service';

const glinerDescribe = process.env.GLINER_MODEL_PATH ? describe : describe.skip;

describe('detectSensitiveWords', () => {
  it('returns no results for empty or whitespace-only input', async () => {
    await expect(detectSensitiveWords('   ')).resolves.toEqual([]);
  });

  glinerDescribe('GLiNER detection', () => {
    it('detects, maps, and de-duplicates sensitive entities', async () => {
      const results = await detectSensitiveWords(
        'Contact Alice Example at alice@example.com. Alice Example can help.',
      );

      expect(results).toEqual(
        expect.arrayContaining([
          { word: 'Alice Example', tag: '<NAME>' },
          { word: 'alice@example.com', tag: '<EMAIL>' },
        ]),
      );
      expect(new Set(results.map(({ word }) => word)).size).toBe(
        results.length,
      );
    });
  });
});

describe('redactSensitiveText', () => {
  it('returns the original empty input without sensitive items', async () => {
    await expect(redactSensitiveText('   ')).resolves.toEqual({
      redactedText: '   ',
      items: [],
    });
  });

  glinerDescribe('GLiNER redaction', () => {
    it('replaces detected sensitive values with typed tokens', async () => {
      const result = await redactSensitiveText(
        'Contact Alice Example at alice@example.com or +27 12 345 6789.',
      );

      expect(result.redactedText).not.toContain('Alice Example');
      expect(result.redactedText).not.toContain('alice@example.com');
      expect(result.redactedText).not.toContain('+27 12 345 6789');
      expect(result.redactedText).toMatch(/\[NAME_\d+\]/);
      expect(result.redactedText).toMatch(/\[EMAIL_\d+\]/);
      expect(result.redactedText).toMatch(/\[PHONE_\d+\]/);
      expect(result.items).toEqual(
        expect.arrayContaining([
          { text: 'Alice Example', type: 'name' },
          { text: 'alice@example.com', type: 'email' },
          { text: '+27 12 345 6789', type: 'phone' },
        ]),
      );
    });
  });
});

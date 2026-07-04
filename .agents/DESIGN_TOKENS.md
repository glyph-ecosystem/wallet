# Design Token Quick Reference (for agents)

## Font Size Mapping (hardcoded → token)
- "32px" / "2rem" → `var(--text-headline)` (context: titles) or keep if hero display
- "24px" / "1.5rem" → `var(--text-headline)`
- "16px" / "1rem" → `var(--text-mono-lg)` for data, `var(--text-body)` for prose
- "15px" / "0.9375rem" → `var(--text-body)`
- "14px" / "0.875rem" → `var(--text-body)`
- "13px" / "0.8125rem" → `var(--text-body)` for prose, `var(--text-label)` for small labels
- "12px" / "0.75rem" → `var(--text-label)`
- "11px" / "0.6875rem" → `var(--text-mono-sm)` for data, `var(--text-caption)` for prose
- "10px" → `var(--text-caption)` (or keep "10px" for tags since no exact token)

## Font Family Rules
- `fontFamily: "var(--font-sans)"` — ALL prose: labels, descriptions, button text, errors, empty states, section headers
- `fontFamily: "var(--font-mono)"` — DATA ONLY: addresses, amounts, hashes, tick numbers, timestamps, balances
- `fontFamily: "var(--font-display)"` — APP NAME ONLY: "GLYPH" wordmark, hero numbers on dashboard

## Spacing Mapping (hardcoded → token)
- "4px" → `var(--space-1)`
- "8px" → `var(--space-2)`
- "12px" → `var(--space-3)`
- "16px" → `var(--space-4)`
- "24px" → `var(--space-6)`
- "32px" → `var(--space-8)`
- "48px" → `var(--space-12)`
- "64px" → `var(--space-16)`

## Radius Mapping
- "4px" → `var(--radius-sharp)`
- "12px" → `var(--radius-card)` (close enough to 16px)
- "16px" → `var(--radius-card)`
- "9999px" / "999px" → `var(--radius-pill)`

## Color Mapping
- "#fff" / "#ffffff" / "white" → `var(--color-text-display)` (for text) or `var(--color-bg-elevated)` (for backgrounds)
- "#000" / "#000000" → `var(--color-bg-base)`
- "#111" / "#111111" → `var(--color-bg-base)` or `var(--color-bg-elevated)`
- Hardcoded grays → use appropriate surface/text token
- QR code colors (bgColor/fgColor on QR component) are EXEMPT — keep as-is

## Section Label Pattern
```tsx
<span style={{
  fontFamily: "var(--font-sans)",
  fontSize: "var(--text-label)",
  fontWeight: 500,
  color: "var(--color-text-disabled)",
  letterSpacing: "0.05em",
}}>
  Section name
</span>
```

## Error Message Pattern
```tsx
<span style={{
  fontFamily: "var(--font-sans)",
  fontSize: "var(--text-caption)",
  color: "var(--color-status-error)",
}}>
  Actionable error message
</span>
```

## Empty State Pattern
```tsx
<div style={{
  textAlign: "center",
  padding: "var(--space-12) 0",
  fontFamily: "var(--font-sans)",
  fontSize: "var(--text-body)",
  color: "var(--color-text-disabled)",
}}>
  No items yet
</div>
```

## Rules
1. Sentence case everywhere (no ALL CAPS except currency codes QU, USD)
2. No textTransform: "uppercase" anywhere
3. No font-mono on labels, descriptions, section headers, errors, or empty states
4. No hardcoded hex colors (except QR code bgColor/fgColor)
5. No hardcoded font sizes (use var(--text-*))
6. No hardcoded spacing (use var(--space-*))
7. No hardcoded radius (use var(--radius-*))
8. Bottom padding: 76px for pages with bottom nav

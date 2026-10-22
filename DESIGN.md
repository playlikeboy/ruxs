# RUXs Design System

> Read this file before changing visual tokens, layouts, or shared components. This is the visual contract for human and AI-generated UI. It follows the refinement and craft guidance from [Impeccable](https://impeccable.style/) and keeps RUXs distinctive without trading away clarity.

## Brand idea

**A good neighbour, made easy to find.** RUXs connects households with local everyday services and family activities. The identity draws from a welcoming little house, a terracotta roof, fresh leaves, a warm cream paper surface, and cheerful cues for food, water, gifts and learning.

Premium comes from craft, rhythm, restraint and consistency. Cute is a warm detail—not a reason to make every panel colourful or turn a working screen into a toy.

## Brand palette

| Token | Value | Purpose |
| --- | --- | --- |
| \`--brand-deep\` / \`brand-deep\` | \`#07583F\` | Wordmark, active navigation, brand emphasis |
| \`--brand-coral\` / \`brand-coral\` | \`#E95135\` | Illustration and small accents |
| \`--accent\` | \`#BD4B2A\` | Primary actions and links; strong text contrast |
| \`--bg\` | \`#FFFDF8\` | Warm paper page background |
| \`--surface\` | \`#FFFFFF\` | Main cards, forms and sheets |
| \`--app-canvas\` | \`#F7F4ED\` | App shell / quiet surrounding canvas |
| \`--app-surface\` | \`#FFFDF8\` | Customer-app surface |
| \`--ink\` | \`#20241F\` | Main text |
| \`--muted\` | \`#716C62\` | Secondary text and metadata |
| \`--line\` | \`#E9E3D8\` | Borders and dividers |
| \`--good\` | \`#2F7D4F\` | Successful delivery and payments |
| \`--warn\` | \`#8E5700\` | Upcoming due date / attention |
| \`--bad\` | \`#B42318\` | Errors, failed delivery, overdue bills |

### Soft accent surfaces

Use the following background fills sparingly in customer-facing app views: peach \`#FFF0E8\`, butter \`#FFF4D8\`, leaf \`#E9F4E7\`, water \`#E8F4FB\`, and gift pink \`#FCE8EF\`. Use one highlight surface for a view's main promotion or selected state; do not put different pastels behind every panel. Keep text dark and legible. Business operations, billing, and admin screens remain predominantly neutral.

Kids Zone keeps the playful Fredoka type and more expressive layouts, but its ink, coral, leaf and cream should still feel like RUXs rather than an unrelated purple product.

## Type, rhythm and shape

- Geist is the shared UI typeface. Fredoka is limited to Kids Zone headings and playful labels.
- Fixed interface scale: 12px metadata, 14px secondary copy, 16px body/forms, 20px section headings, 24–28px page headings. Use tabular numerals for amounts, quantities and dates.
- Use the 4px spacing grid: 4, 8, 12, 16, 24, 32, 48.
- Controls: 12px radius. Cards: 16px. Feature banners: 20–24px. Status chips: pill-shaped only when they communicate a compact state.
- Default transition is 150–200ms ease-out. Motion communicates feedback or child-focused delight; respect \`prefers-reduced-motion\`.
- Avoid double elevation: choose a hairline border or a subtle soft shadow. Never use hard block shadows as a default.

## Interface behavior

### Operate mode — customer app, merchant workspace, admin

People are completing a task, often on a phone. Use familiar navigation and actions, clear hierarchy, and content-first layouts. Brand personality belongs in the selected tab, button, quiet surface tint, product image, icon and empty state—not in visual noise.

- Design the customer app at 360px first; maintain a comfortable reading width and 48px targets for primary touch actions.
- Every control has hover/focus/active/disabled and, where relevant, loading/error states. Keep visible keyboard focus.
- Status is always words plus colour; colour alone is never the only status signal.
- Forms use at least 16px input text to avoid iOS zoom. Placeholder and secondary copy must stay legible.
- Use skeletons for loading and empty states that explain a helpful next step.
- Use real icon components (Lucide or a purpose-built SVG), not emoji standing in for general interface controls. Category-supplied emoji may remain when it is the category's own identity; Kids Zone may be more expressive by design.
- Avoid gradients on generic cards, excessive same-shaped icon/title/body tiles, nested cards, gratuitous shadows, and motion that delays work.
- Preserve money rules, item counts, delivery cutoffs, auth, location, and route behavior. No decorative change may alter product meaning or fabricate availability.

### Persuade mode — public marketing and sharing

Use the supplied RUXs app logo, Open Graph art and brand illustration assets. Keep copy honest about neighbourhood coverage and provider-specific prices. A wide illustration can tell the brand story, but the authenticated app stays scan-friendly and restrained.

### Accessibility and responsive checks

- Meet WCAG AA contrast: 4.5:1 normal text, 3:1 large text and important UI boundaries where applicable.
- Keep focus rings visible against both cream and white backgrounds.
- Ensure 360px mobile, tablet and desktop layouts do not clip headings, controls or long provider names.
- Respect safe-area insets for standalone PWA navigation and bottom controls.
- Do not remove browser zoom or focus affordances without a product-approved accessibility reason.
- Keep number formatting in Indian locale and money stored as integer paise.

## Impeccable workflow for AI-generated UI

For new UI or meaningful visual edits, consult [Impeccable](https://impeccable.style/) in the coding environment: use its **Operate** guidance for app surfaces and **Persuade** guidance for marketing; inspect the current code and design tokens before changing them; use critique/audit for problems and polish before shipping. Do one bounded, combined desktop/mobile review and fix what it reveals instead of endless cosmetic loops. If the CLI or browser preview is unavailable, say so and rely on source inspection rather than claiming a rendered verification.

Use this file as the tie-breaker for future code generated by any AI.

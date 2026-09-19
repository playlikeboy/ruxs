# RUXS Design System

RUXS uses a single visual language called **Editorial Utility**: quiet, precise, premium, and operational.

## Principles

- Quiet over flashy: no decorative gradients or oversized visual effects.
- Information first: hierarchy comes from type, spacing, and alignment.
- One accent at a time: brand red identifies RUXS; signal green marks action and healthy state.
- Tactile surfaces: subtle borders and restrained elevation replace heavy shadows.
- Consistent geometry: 10px / 14px / 20px radii are the default scale.
- Editorial typography: Geist for interface text and a restrained serif display face for marketing headlines.
- Operational clarity: every metric, state, and action should be immediately scannable.

## Core tokens

| Token | Value | Usage |
| --- | --- | --- |
| Background | `#0b0d0c` | Page background |
| Surface | `#101412` | Cards and panels |
| Raised surface | `#151a17` | Active/interacting surfaces |
| Text | `#f4f2ec` | Primary copy |
| Muted | `#a9aea8` | Secondary copy |
| Subtle | `#777d77` | Metadata |
| Brand | `#e24a3b` | RUXS identity |
| Signal | `#9fc58f` | CTA and positive state |
| Cream | `#e7dfc8` | Editorial highlight |
| Line | `rgba(244, 242, 236, 0.10)` | Borders/dividers |

## Typography

- Interface: Geist Sans.
- Marketing display: system serif stack.
- Monospace: Source Code Pro for identifiers and operational values.

## Shared classes

The marketing shell uses these centralized classes from `app/globals.css`:

`ds-container`, `ds-section`, `ds-kicker`, `ds-display`, `ds-card`, `ds-button`, `ds-button-secondary`, `ds-rule`, and `ds-muted-grid`.

Application screens should continue using the shared UI primitives while consuming the same semantic color, radius and typography tokens.

## Content rules

Describe product capabilities accurately. Avoid unsupported guarantees such as perfect service levels or guaranteed zero losses unless measured operational data supports the claim.

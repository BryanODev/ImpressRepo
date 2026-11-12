# Impress Editor Architecture (v0.3)

## Principle: composition over duplicated editor engines

`ImpressEditorCore.PreviewStage` owns common canvas rendering coordination, background, sizing and interactive tilting. Shared transforms/handles are kept in `impress-editor-core.js`. Product editors compose this preview class instead of inheriting duplicated rendering behavior.

Each product consists of:

1. **Public product config** (`impress-<product>-config.js`) — editable offering and visual measurements.
2. **Product editor** (`impress-<product>-editor.js`) — drawing and tools unique to the product.
3. **Product configurator** (`impress-<product>-configurator.js`) — reads config, validates real Shopify variants and synchronizes UI.
4. **Section/template** — Shopify Liquid and product JSON page.

Core (`impress-editor-core.js`) and shared preview CSS are used by both product editors. Distinct product functionality must live in the corresponding product editor, not in the core.

## Data flow

Public config + Shopify real variant JSON → configurator filters displayable combinations → finds exact variant ID and actual price → editor renders preview with user options → Shopify product form submits original artwork and edited reference file.

No custom price can be derived or written by theme JavaScript. When no matching priced combination exists, checkout is blocked; editing can remain available in preview mode.

## Security and future scaling

Client-side feature flags are convenience, not access controls. The theme assets are public. Price and inventory validation ultimately comes from Shopify at checkout. Production-grade uploads, file retention, future automated cutlines, and high-variant catalogs may require further architecture work.

Remaining shared refactors: image loading, history, exports and integration testing. We intentionally kept these independent in this release to avoid rewriting checkout logic at the same time.

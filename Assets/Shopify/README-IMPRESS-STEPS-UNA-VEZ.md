# Impress — Staggered animation only once

## Installation

In Shopify Admin > Online Store > Themes > Edit code, replace only:

`sections/impress-order-instructions.liquid`

This is a replacement-files ZIP, not a complete Shopify theme. No icon files need to be uploaded again.

## Behavior

- Each step animates the **first time** it enters the viewport on a page load.
- Scrolling away and returning does not replay the reveal; the card stays visible.
- Refreshing the page resets the reveal.
- Hover lift remains active and can happen repeatedly.
- Reduced-motion visitors see the cards immediately without an entrance animation.
- Existing icon, number, layout, text, and Theme Editor settings remain unchanged.

The only JavaScript change is that each step is marked visible once on intersection and is then unobserved. Previously the visibility class toggled every time the card entered or exited the viewport.

Local tests verified first reveal, scroll out/in, hover, fresh page load, and reduced motion.

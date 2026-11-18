# Impress Static Logos — the marquee style without animation

Replace ONLY `sections/impress-clients-static.liquid` in your theme.
Do NOT modify `sections/impress-clients-marquee.liquid`.

This static section copies the original marquee's visual styling:
- 1440px container and same 11px uppercase heading
- Images keep their original aspect ratios and natural heights
- Each logo has its own editable width (180px default)
- Same 48px gap, subtle hover lift and opacity effect
- On mobile, logos use 70% of their configured width as the original does
- No auto-scroll, cloned images, edge fades, fallback text or placeholder logos

Theme Editor → Impress Static Logos:
- Add Client Logo blocks and assign images.
- First 6 populated images appear in row 1, the next 4 in row 2 (defaults).
- Edit the two row counts to adjust this grouping.
- Edit each logo's Custom Card Width (same as marquee).
- You can adjust row spacing, logo spacing, and section padding.
- On narrow screens the two groups can wrap so the logo widths remain readable.

Previously saved image/title/link values on this static section are preserved
because the existing section filename and logo block IDs remain the same.
The original moving marquee remains unchanged.

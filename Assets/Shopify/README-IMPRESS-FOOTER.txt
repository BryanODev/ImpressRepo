IMPRESS | Footer: social SVG icons + credit logo
================================================

COPY ONLY THESE FILES INTO THE CORRESPONDING FOLDERS OF YOUR SHOPIFY THEME:

sections/impress-footer.liquid     (replace existing)
assets/impress-footer-instagram.svg (new)
assets/impress-footer-facebook.svg  (new)
assets/impress-footer-whatsapp.svg  (new)
assets/impress-footer-credit-logo.png (new, your supplied Impress logo)

WHAT CHANGED
- Replaces the visible Instagram/Facebook words with compact SVG icon buttons.
- Replaces only the small WhatsApp icon with the SVG you supplied; the existing
  WhatsApp button text, appearance, and destination remain unchanged.
- Adds a smaller "Hecho por" + Impress logo credit immediately below the
  existing footer main logo. Uses the supplied PNG automatically.
- Keeps the footer menus, social links, contact details, main logo and
  Shopify footer-group settings untouched.

THEME EDITOR
Customize > Impress Footer > Crédito de Impress
- Mostrar crédito de Impress: show/hide the credit
- Texto del crédito: edit "Hecho por"
- Tamaño del logo de Impress: 60 to 180 px, default 110 px
- Otro logo de Impress (opcional): override the supplied PNG

The original Shopify footer is only the section above; you do not need to
replace sections/footer-group.json or sections/footer.liquid.

The three SVG assets use your supplied Instagram, Facebook and WhatsApp artwork.
Illustrator-only metadata and duplicated SVG paths were removed for small,
standalone icon files. Instagram/Facebook remain white for the dark footer;
WhatsApp retains its official green.

Test on a development-theme preview before publishing, especially with
any changes saved through Shopify's Theme Editor.

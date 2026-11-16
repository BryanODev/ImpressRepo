# Impress Shopify v0.4.4 — Artwork formats + removal of sharing links

## Upload into a DUPLICATED Shopify theme

Copy the files under `assets/`, `sections/`, and `snippets/` to those same folders in Shopify. You can replace the existing files with the names in this ZIP. **Do not overwrite your homepage JSON or product variants.**

New shared file: `assets/impress-artwork-preview.js`. This must be uploaded along with the editor/controller changes.

## New workflow

- No external artwork URLs, no second preview file, no external-storage link field.
- One direct upload per side (front / back if applicable), maximum 20 MB per file.
- Accepted types: SVG, PNG, JPG, JPEG, TIF, TIFF, PDF.
- Clicking the empty editor still opens the same file picker.
- Original is kept unchanged as a Shopify line-item file property. An edited PNG reference is prepared as a separate line-item property.
- PNG/JPEG/SVG can display locally without extra dependencies.
- PDF and TIFF first-page previews need the browser to fetch pinned JavaScript decoders from cdnjs/jsDelivr/unpkg. No separate Node.js server or paid hosting required, but they will not preview if those CDNs are blocked.
- SVG previews are sanitized; user-supplied original files are not modified.
- Multi-page PDF/TIFF: only FIRST PAGE visible/editable; original full file still goes to Shopify.

## Before showing this to your boss

1. Upload a PNG and place a test order. Check Shopify Admin > Orders for **Arte original** and **Vista editada**.
2. Repeat for SVG, JPG/JPEG, TIF and PDF, and check which formats Shopify actually retains. **Acceptance by the local editor is not proof Shopify retains every file type.**
3. Repeat a double-sided Business Card or Flyer order; verify both front and back originals/previews.
4. Check the 20 MB behavior and file accessibility in the order detail.

## Limitations

- 20 MB is the configured storefront file-size ceiling, not a promise that Shopify accepts all formats on product forms.
- Some PDFs and TIFFs may fail to render due to unsupported compression, password protection, or browser memory limits. The UI shows an error; checkout will not silently treat a missing preview as completed artwork.
- The edited PNG is a design reference, not guaranteed to be print-ready (bleed, DPI, CMYK, fonts).
- No hosting/back-end changes. Pricing and product variants are untouched.

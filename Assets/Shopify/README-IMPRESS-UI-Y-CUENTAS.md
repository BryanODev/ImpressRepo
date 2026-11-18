# Impress — FAQ, Static Logos, Mobile Navigation and Customer Accounts

## Install in Shopify theme

This ZIP contains **only replacement/new section files**, not a complete Shopify theme.

In **Online Store → Themes → Edit code**, place each file under **Sections**:

- `sections/impress-home-faq.liquid` — replace the current homepage FAQ section. Hovering a question changes the question text to the section's configurable yellow Accent color.
- `sections/impress-clients-static.liquid` — add this **new** section. The existing moving `impress-clients-marquee.liquid` is unchanged.
- `sections/impress-classic-navbar.liquid` — replace the current classic navbar section with the latest mobile layout. Desktop menus, sticky toggle, account dropdown, and cart count remain.

Do not import the ZIP as a whole theme. Use a duplicated development theme first.

## Static client logos: two rows, no dummy images

In **Customize → Add section → Impress Static Logos**:

1. Add one **Client logo** block for each image (10 blocks for the default layout).
2. Upload the logo image in each block. Add a client name for accessible image descriptions; link is optional.
3. Drag the blocks to reorder. The first 6 go in row one; blocks 7–10 go in row two.
4. The section settings **Logos in first row** (default 6) and **Logos in second row** (default 4) control the layout and block allocation. For instance, changing these to 5 and 5 makes the first 5 blocks row one and the next 5 row two.
5. Adjust logo height, grid gap, row gap, section width, spacing, and colors.

Blocks without an image render **nothing**. There are no fallback logos, sample names, or placeholder pictures. Add the section and real images in Shopify's editor.

On mobile the images automatically reflow to three columns (tablet) and two columns (small screens) to avoid tiny logos.

## Mobile Classic Navbar

- Left: hamburger, switching to X when open.
- Middle: same Impress logo, centered.
- Right: same account and printing-order cart icons as desktop.
- Full menu under navbar: only product groups. Each group opens the same product-card list as desktop, with a back arrow.
- Account/cart buttons no longer appear inside the mobile menu.
- The top bar remains visible when the product menu is open; the sticky setting still controls its normal scrolled behavior.
- Signed-out account icon continues to show sign-in / create-account links; signed-in account icon continues to show account links.

If the account icon is absent, check that customer accounts are enabled in Shopify.

## Sign-in / registration / orders / profile branding (Shopify-hosted pages)

**Important:** Shopify's *new customer accounts* do not use theme Liquid templates for sign-in, registration, orders, profile, or order status pages. Therefore these pages cannot be redesigned by installing the three theme files above. The account links continue to work, but the branding must be applied within Shopify's separate **Checkout and accounts editor**.

1. From Shopify Admin, go to **Settings → Checkout**.
2. Under **Configurations**, choose **Edit** on the appropriate checkout configuration.
3. In the page selector, pick **Sign in**. Set your Impress logo and brand colors, and (if desired) a hero image.
4. In the same editor, select **Customer accounts / Orders / Profile / Order status** as available. Apply matching logo, brand colors, and other provided controls. Some styling settings are shared with Checkout and can be overridden per page.
5. Save, preview, and ensure the configuration you changed is active for the development store.

Suggested Impress palette to start:

| Element | Suggested color |
| --- | --- |
| Dark background | `#111111` |
| Yellow accent / primary buttons | `#FFD800` |
| White text | `#FFFFFF` |
| Muted gray | `#A6A6A6` |
| Light surface (if needed) | `#F7F8F9` |

Choose the appropriate available foreground contrast in the checkout/accounts editor. Theme Editor fonts/colors do **not** automatically determine the new accounts pages' appearance. New Shopify customer accounts use a sign-in flow that creates/recognizes the account through verification; a separately themed legacy registration page is not generally available.

Advanced account functionality and custom sections generally require supported customer-account apps/extensions; ordinary Shopify section files cannot replace Shopify-hosted pages.

Official documentation:
- https://help.shopify.com/en/manual/customers/customer-accounts/customize-customer-accounts/customize
- https://help.shopify.com/en/manual/checkout-settings/customize-checkout-configurations
- https://shopify.dev/docs/storefronts/themes/architecture/templates

## Smoke tests

1. Hover a FAQ question: its text turns the selected accent color; keyboard focus remains visible.
2. Add 10 logo images and confirm 6 images in the first row, 4 centered in the second on desktop.
3. On mobile at 320px/390px: hamburger left, logo center, account/cart right; no overlap.
4. Open menu, choose Stickers, tap Back, tap X. Check user dropdown and cart separately.
5. On desktop, hover product links and verify dropdowns still function.
6. Check sign-in and order/profile pages after applying branding through Checkout and accounts editor.

Theme/JS checks were performed locally with a representative navbar fixture. Final Shopify-hosted rendering and customer account page branding must be checked in the store.

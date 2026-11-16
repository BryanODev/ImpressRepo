# Impress Header — editable categories, products, buttons, and account menu

## Installation

Replace **only** `sections/impress-header.liquid` in a duplicate of the current Shopify theme with the file in this ZIP. This is a one-file update: do not upload the ZIP as a complete Shopify theme.

The existing `column` and `item_card` block IDs, original two CTA settings, logo settings, navigation menu, and cart-count snippet usage are preserved. Your product configurators, prices, add-ons and editor assets are not changed.

## Theme Editor configuration

Go to **Online Store → Themes → Customize → Header → Impress Header** (the header section might appear under the Header group).

### Yellow rectangular buttons

Under **Yellow CTA Buttons**, switch off **Enable yellow CTA buttons** to remove all of them, or independently turn off **Show original button 1** and **Show original button 2**. You can also add **Yellow CTA Button** blocks if you want more buttons. A CTA is only shown when it has a label and a real link; this prevents dead-end buttons.

### Product explorer / search hover menu

This remains a **product explorer on hover**, not a text search field. On touch devices, tap it to open/close. The top settings let you edit its label, width, banner, and View All link.

You have two ways to build each category, and you can mix them:

**Manual product cards (best for customized text/icons)**

1. Click **Add block → Product Category** (these are the old `column` blocks and are kept compatible).
2. Enter the category heading, e.g. **Stickers**, **Banners**, or **Stationery**. Optionally select a Shopify **Collection** for its **Ver todos** category link.
3. Leave **Show products from → Product Card blocks below** selected.
4. Immediately after the category block, add one or more **Product Card** blocks. Drag them underneath that category and before the next category.
5. Each card can select a Shopify product, or specify a custom URL. A selected product provides its URL, name, thumbnail and short description when the custom fields are empty. To override the name/description, fill in the custom fields; choose Auto, Custom image, or Emoji for the icon.
6. Repeat **Product Category → Product Card(s)** for your other categories.

**Automatically populate from a collection**

1. Add a **Product Category** block, set **Show products from → Shopify collection automatically**, and select a Shopify Collection.
2. Choose **Auto product limit** (2–12). Product cards are then read from Shopify automatically.
3. You can optionally turn on/off the **Ver todos** collection link.
4. Any Product Card blocks after this category are ignored until the next manually configured category. Use manual mode for custom card descriptions or icons.

**Existing old cards:** your previously saved titles and descriptions are retained. To display the selected Shopify product's name and description automatically, clear the custom title and description on that card. To remove wrong legacy links, select a real product and clear any custom URL.

Shopify has a **50-block limit per section**; categories, product cards, and optional CTA blocks all count toward this limit. For much larger menus, use collection auto-population rather than creating dozens of cards.

### Account icon and menu

Enable **Show account button** in the section. Shopify must also have **customer accounts enabled** under **Settings → Customer accounts**.

- When logged out, the person icon opens the dropdown with **Iniciar sesión** and **Crear cuenta** buttons.
- When logged in, it shows **Mis pedidos**, **Mi perfil**, **Mis direcciones**, and **Cerrar sesión**.
- These links are Shopify account routes, not custom login forms. In **new Shopify customer accounts**, sign-in and account creation can share Shopify's passwordless authentication flow.
- The existing cart icon and its printing-job counter are unchanged.

## Verification

Local checks were run with a representative rendered HTML fixture in Chromium: desktop hover (including moving the pointer into product cards), click, Escape, click-outside, customer menu click/outside, mobile click, and no horizontal overflow on mobile. The JSON section schema and Liquid control-tag structure were checked locally. **Real Shopify Liquid rendering, customer sign-in, and Theme Editor saves must still be tested in your development store**.

Official references:
- https://shopify.dev/docs/api/liquid/objects/routes
- https://shopify.dev/docs/storefronts/themes/sign-in
- https://shopify.dev/docs/storefronts/themes/architecture/sections/section-schema

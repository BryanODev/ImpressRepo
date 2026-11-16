# Impress — Shopify Add-ons System

This ZIP contains only theme files added/changed from the latest `Shopify.zip` upload (November 15, 2026). It preserves `assets/impress-variant-mapping.js` and the existing product variant definitions.

## 1) Install the theme changes

In a **duplicate of your live Shopify theme**, replace each matching file by path under `assets/`, `layout/`, `sections/`, and `snippets/`. New files are placed in the same folders. Do **not** upload the replacement-files ZIP as an entire Shopify theme: it contains only changed files.

Supported Impress configurators: stickers, banners, flyers, business cards. Nothing needs to be configured in JavaScript to add more services to these products.

## 2) Create Shopify metafield definitions — ONCE

In Shopify Admin > Settings > Custom data:

**Products**

| Name (suggested) | Namespace and key | Type |
|---|---|---|
| Impress optional add-ons | `custom.impress_addons` | Product variant → **List of variants** (`list.variant_reference`) |
| Impress required add-ons | `custom.impress_required_addons` | Product variant → **List of variants** (`list.variant_reference`) |

**Variants**

| Name (suggested) | Namespace and key | Type |
|---|---|---|
| Impress add-on role | `custom.impress_addon_role` | Single line text (`single_line_text_field`) |

These namespace/key combinations must match exactly. Use any visible metafield labels you want.

Note that the add-on role is only needed for artwork design services; set its value to `artwork` on the **service variant**. Any other value (or blank) works for generic services such as rush production, file correction, or proofing.

## 3) Create service products in Shopify Admin

Example: **Artwork Design** as a separate Shopify product, with variants:

- Sticker Artwork: $10.00
- Banner Artwork: $25.00
- Flyer Artwork: $15.00
- Business Card Artwork: $20.00

For each of these four service variants, set `custom.impress_addon_role` to `artwork`. Create another product **Rush Production** and give it different variant prices per print product. Rush variants do not need a special role.

Publish the service products to the **Online Store sales channel**, because the Shopify Cart API must be able to add the referenced variants. Configure each as a non-shippable service when appropriate; ensure inventory/availability are set correctly. Keep service products out of regular collections/navigation if you don't want them advertised individually.

## 4) Assign add-ons to any Impress printing product

Go to Shopify Admin > Products > your printing product (e.g. Custom Stickers) > metafields:

- **Impress optional add-ons:** select `Sticker Artwork ($10)`, `Sticker Rush ($15)`, etc.
- **Impress required add-ons:** select any variants that must always be included. Required options are pre-selected and cannot be deselected in the configurator.

On the banner product, choose **Banner Artwork ($25)** and **Banner Rush** instead. Each product's selections and prices come entirely from Shopify. Add, remove, or change these references without editing theme code. Add-on variants do **not** consume the 3 option slots on the printing product.

Do not add the same exact service variant to both the optional and required lists; the theme hides duplicates from the optional list if required.

## 5) What buyers see

- Services are listed inside the existing product configurator (no extra product type or Shopify product variant index mapping).
- Add-on prices and availability come from the referenced Shopify service variants; the subtotal preview updates when buyers select services.
- Selecting an `artwork` service makes the original artwork upload optional and displays a **required written design brief**. Buyers can still attach a file as a reference.
- If no artwork service is selected, the existing original file requirement remains in place.
- The original product form continues to submit files natively to Shopify.
- After the printing product is added, the cart attaches services as Shopify **nested cart lines** using `parent_line_key`. Each add-on is charged at its Shopify variant price and appears beneath the main printing order. A separate child has no Remove/Quantity control in the Impress cart UI.
- When Shopify removes the parent order, it also removes its nested children. If a selected child is missing, the cart attempts to restore it and holds its normal checkout button disabled until it is confirmed.
- Artwork and rush services are charged **once per printing cart line/job**, irrespective of number of copies/banners on that line. Add multiple separate jobs for multiple designs.

## 6) Important limitations before publishing

**This theme cannot provide tamper-proof checkout validation.** A shopper who manipulates the Cart API, goes to checkout without visiting the cart, or otherwise bypasses the storefront might remove a service while retaining the main product. Shopify's nested relationship ensures *parent removal also removes children*; it does NOT make the children irrevocable.

To fully enforce the business rule at checkout, install/develop a suitable **Shopify cart-and-checkout validation app/Function** that checks each printing line's trusted required-service configuration and its matching attached children. A theme ZIP alone cannot install a server-side Function or activate Checkout rules. Plan eligibility and app type matter (Shopify Functions from **custom apps** typically require Plus; **public apps** supporting Shopify Functions can run on non-Plus plans).

Also test your store's real native multipart/form-data original-artwork upload and the native `/cart/add` → cart redirect, plus nested cart lines, in a duplicate unpublished theme. Browser tests run here use simulated cart API responses, **not a live Shopify checkout**.

## 7) Test checklist (on duplicate theme)

1. Create a sticker order with no add-on and upload a file. Check the cart contains only the sticker product and original file.
2. Select sticker artwork, enter brief, skip the file upload. Check sticker + $10 Artwork service in the cart and checkout subtotal.
3. Select artwork and rush together. Check the two service charges both appear nested under the correct parent.
4. Create one banner order with a different artwork price. Ensure it links to the banner only.
5. Remove the parent item and confirm Shopify automatically removes its attached services.
6. Test a required service with an unavailable variant. Confirm the theme refuses to submit.
7. Test on your payment path with a server-side validation app before relying on this to prevent missing service charges.

## Technical details

Parent properties: `_Impress Addons` (comma-separated referenced variant IDs), `_Impress Job` (job link ID), `Preparación del arte` and, when artwork is chosen, `Indicaciones para el diseño`. Child properties: `_Impress Addon` and `_Impress Job`.

The cart reconciling code is in `assets/impress-addon-cart.js`; it uses the documented Shopify Cart Ajax API with `parent_line_key`. Existing variant position mapping is unchanged.

Useful official references:
- https://shopify.dev/docs/apps/build/product-merchandising/nested-cart-lines
- https://shopify.dev/docs/apps/build/product-merchandising/nested-cart-lines/create-nested-cart-lines
- https://shopify.dev/docs/api/ajax/reference/cart
- https://help.shopify.com/en/manual/custom-data/metafields/metafield-definitions/metafield-lists
- https://help.shopify.com/en/manual/checkout-settings/checkout-customization

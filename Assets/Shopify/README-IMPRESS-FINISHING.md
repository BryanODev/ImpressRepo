# Impress — Add-ons with size-dependent prices

This is an update to the **existing** Impress universal add-on system. It uses your latest `Shopify.zip` and preserves the index-based product variant mapping, existing Artwork Design services, and artwork upload workflow.

## 1. Install the updated theme files

**Make a duplicate of your Shopify theme first.** In **Online Store > Themes > ... > Edit code**, replace the files at exactly these paths:

- `assets/impress-addons.js`
- `assets/impress-addons.css`
- `assets/impress-addon-cart.js`
- `assets/impress-sticker-configurator.js`
- `assets/impress-banner-configurator.js`
- `assets/impress-paper-configurator.js`
- `snippets/impress-addon-picker.liquid`

This ZIP has **only replacement files**, not a complete Shopify theme. Do not upload it as an entire theme. `README-IMPRESS-FINISHING.md` is for your reference, not required as a theme asset.

## 2. Keep your existing Shopify metafields

No changes to these three existing definitions are needed:

| Owner | Metafield key | Type |
|---|---|---|
| **Products** | `custom.impress_addons` | List of **product variants** |
| **Products** | `custom.impress_required_addons` | List of **product variants** |
| **Variants** | `custom.impress_addon_role` | Single line text (`artwork` only on art-service variants) |

### Create TWO new variant metafields for size-priced finishing

Go to **Settings > Metafields and metaobjects > Metafield definitions > Variants > Add definition**. Create:

| Name (suggested) | Namespace and key (EXACT) | Type |
|---|---|---|
| Impress Add-on Group | `custom.impress_addon_group` | **One → Single line text** |
| Impress Add-on Size | `custom.impress_addon_size` | **One → Single line text** |

Enable **Storefront API access**. These belong under **Variants**, not Products.

**Optional, for more complex prices:**

| Name | Namespace and key | Type | Purpose |
|---|---|---|---|
| Impress Add-on Pack | `custom.impress_addon_pack` | **One → Integer** | Limit a finishing price to an exact print-pack quantity (100, 250, 500, etc.) |
| Impress Add-on Charge | `custom.impress_addon_charge` | **One → Single line text** | Set value `per_unit` to charge for each physical banner instead of once per job |

You can create those optional definitions now or only when needed.

## 3. Create one Shopify product: Finishing Services

**Shopify Admin > Products > Add product**

- **Title:** `Finishing Services`
- **Status:** Active
- **Sales channel:** Online Store enabled (for Cart AJAX add-to-cart)
- **Shipping:** Uncheck "Physical product" where appropriate; keep service variants available.
- **Variants:** Create **one option** named, for example, `Service and Size`. Each option value is an independent paid service-size combination. You do NOT need a variant for "No".

Example values/prices (**examples only**, set your real prices in Shopify):

| Finishing Services variant title | Price | Group metafield | Size metafield | Charge metafield |
|---|---:|---|---|---|
| Sticker Lamination 1x1 | $4.00 | `Laminado` | `1 x 1 in` | blank (`per_job`) |
| Sticker Lamination 3x3 | $10.00 | `Laminado` | `3 x 3 in` | blank (`per_job`) |
| Reinforced Grommets 3x4 | $8.00 | `Argollas reforzadas` | `3 x 4 ft` | `per_unit` |
| Reinforced Grommets 4x8 | $16.00 | `Argollas reforzadas` | `4 x 8 ft` | `per_unit` |

For each service **variant**, open its variant editor, scroll down to **Variant metafields**, set **Impress Add-on Group** to the same name for all size choices of one service, and enter its **Impress Add-on Size**. Update the price in Shopify's normal Price field.

**Important:** The service size must match the *selected physical print size*. Include units. `3 x 4 ft` matches `36 x 48 in`; `3 x 4 in` does **not** match `3 x 4 ft`. Orientation reversal, e.g. `4 x 3 ft`, is treated as the same size. For round stickers, a `3 in` diameter is *not* assumed to equal a `3 x 3 in` square. For size aliases like `A4`, use exactly the same alias on both sides.

### Sticker quantity-specific material pricing (optional)

If 100 stickers should cost a different amount to laminate than 500 stickers, create separate variants, such as:

| Variant | Price | Group | Size | Pack |
|---|---:|---|---|---:|
| Sticker lamination 3x3, 100 pieces | $10.00 | Laminado | `3 x 3 in` | `100` |
| Sticker lamination 3x3, 500 pieces | $35.00 | Laminado | `3 x 3 in` | `500` |

The theme picks the most specific matching Shopify variant. If none matches, the optional finishing button becomes unavailable; if a *selected* finishing service becomes unavailable after changing size, the theme **blocks the product form** instead of silently removing the charge. Two service variants with the same group, size, and pack produce a conflict and block selection. A variant with the same group and size but **no Pack** is a fallback for any pack quantity.

Do **not** set `per_unit` on sticker lamination if its price is already **per pack**. `per_unit` multiplies by the number of the main cart product, e.g. multiple physical banners; it does **not** mean the number of stickers inside a 100-piece pack.

### A note about banner grommets

The existing banner configurator has a **mounting** Shopify variant option, including grommet/`Argollas` configurations. **Don't charge the same standard grommets twice.** Either include their size-dependent cost in the banner's own Shopify mounting/size variant price, **or** use Finishing Services for a genuinely optional *upgrade*, such as reinforced/extra grommets. The example above assumes the latter.

## 4. Connect the prices to a printing product — in Shopify Admin, NOT JS

For **Custom Stickers**, go to **Products > Custom Stickers > Product metafields > Impress Addons** and add **all Sticker Lamination variants** (e.g. both `Sticker Lamination 1x1` and `Sticker Lamination 3x3`). Keep `Sticker Artwork` and `Sticker Rush` if already selected. Save.

For **Banners**, go to your banner product's **Impress Addons** and select the **relevant Reinforced Grommets variants** (e.g. 3x4 and 4x8). Save.

If an add-on must always be included, put **all of its size-specific variants** into `Impress Required Addons` **instead**, not both fields. All variants belonging to the same **Group** must consistently be optional or consistently required. Leave the group metafield empty for ordinary fixed-price checkbox services like Artwork Design or Rush Production.

**You do NOT need to create a new theme section, modify index mappings, or add prices or dimensions to JS.** Changing Shopify service variant prices and per-product references updates the choices.

## 5. What customers see

- A finishing group (`Laminado`, `Argollas reforzadas`, etc.) is shown as a **No / Add** choice.
- The price updates when size or (if configured) print-pack quantity changes.
- For banners with `per_unit`, 2 banners × $16 grommet upgrade = **$32 add-on charge**, and cart quantity changes update the nested service quantity.
- Ordinary services with no Group metadata stay as the existing checkbox list.
- The selected real Shopify service variant ID and quantity go into hidden product properties. The existing nested-line cart reconciler attaches it as a paid Shopify cart line.

## 6. Limits and important safeguards

- **Live Shopify integration has not been tested here.** Local Chromium tests used synthetic product data and simulated Shopify Ajax responses. First test on an unpublished duplicate theme: select size, change pack, select service, add original art, add to cart, check actual nested variants/prices and complete a test checkout.
- This remains **theme-level validation**, not tamper-proof server-side checkout validation. A suitable checkout validation app/Function is needed to make it impossible to bypass service charges with direct API/cart manipulation.
- Shopify Liquid renders **at most 50 reference items from a metafield reference list**. If you need a larger size/quantity pricing matrix *on one printing product*, the present `list.variant_reference` architecture needs a scalable loading approach. Shopify admin supports larger lists, but a theme loop can still truncate them.
- A service variant must be **available** for sale on Online Store to be added to the cart. Don't link draft/unavailable service variants.
- Physical size and printing variant prices still come from the original Shopify product; service variant prices and inventory come from the separate service product.

## 7. Quick test checklist

1. Sticker 1x1 + Laminado → correct 1x1 price; switch to 3x3 → correct new price.
2. If using `impress_addon_pack`, switch pack 100 → 500 → price updates.
3. Sticker with no lamination still buys normally; artwork add-on still makes uploaded original optional with a required design brief.
4. Banner 3x4 → 4x8 switches service variant; changing banner quantity from 1 to 2 increases `per_unit` add-on charge.
5. In the actual Shopify cart, the correct Finishing Services variant(s) appear under the correct printing job and totals are charged by Shopify.
6. Remove the parent order or change its quantity; verify nested services are removed/adjusted appropriately.
7. Try a required service with no matching price. Submission should be blocked with an explanation.

### Official reference

- https://shopify.dev/docs/apps/build/product-merchandising/nested-cart-lines
- https://help.shopify.com/en/manual/custom-data/metafields/metafield-definitions/metafield-lists
- https://shopify.dev/docs/apps/build/metafields/metafield-limits

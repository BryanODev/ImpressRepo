# Impress Homepage Hotfix v1.0.1

Shopify reported:
- `sections/impress-catalog-grid.liquid`: `vertical_padding` default not on a valid step.
- `templates/index.json`: `vertical_padding` value not on a valid step.

Both values are now **45**, matching the configured slider `min: 0, max: 100, step: 5`.

## How to install
Replace only the two files at their matching theme paths:

1. `sections/impress-catalog-grid.liquid`
2. `templates/index.json`

**Important:** `templates/index.json` is your homepage arrangement and content. If you've modified the homepage since the full refresh, don't overwrite your newer version. Instead find `impress_catalog_grid_HEyTGa.settings.vertical_padding` in your current `templates/index.json` and change `44` to `45`.

Validated: three custom homepage section JSON schemas, their slider defaults, the updated homepage template values and JSON syntax. Live Shopify theme editor was not tested.

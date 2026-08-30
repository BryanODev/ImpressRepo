const t =
    window.TrelloPowerUp.iframe();


/*
 * ========================================
 * SETTINGS
 * ========================================
 */


const PRINT_CUSTOM_FIELDS = [
    'Vendedor *',
    'Fecha Creacíon *',
    'Cliente *',
    'Nombre Cliente *',
    'Fecha Solicitada *',
    'Metodo De Entrega'
];


/*
 * 11.5% = 0.115
 */
const IVU_RATE = 0.115;


/*
 * ========================================
 * STORAGE
 * ========================================
 */


const STORAGE_KEY =
    'itemsTable';


/*
 * ========================================
 * PRODUCT CATALOG
 * ========================================
 *
 * Loaded once at startup so option labels
 * and option order match the same
 * products.json that table.js uses.
 */


async function loadCatalog() {

    try {

        const response =
            await fetch(
                './products.json',
                { cache: 'no-cache' }
            );

        if (!response.ok) {
            throw new Error('Could not load products.json');
        }

        const catalog =
            await response.json();

        if (!catalog || !Array.isArray(catalog.products)) {
            throw new Error('Invalid products.json format');
        }

        return catalog;

    } catch (error) {

        console.error(
            'Could not load product catalog:',
            error
        );

        return null;

    }

}


function getProduct(catalog, productId) {

    if (!catalog || !Array.isArray(catalog.products)) {
        return null;
    }

    return catalog.products.find(function (product) {
        return product.id === productId;
    }) || null;

}


function findOptionDefinition(optionId, product) {

    if (!product || !Array.isArray(product.options)) {
        return null;
    }

    return product.options.find(function (def) {
        return def.id === optionId;
    }) || null;

}


/*
 * ========================================
 * LOAD DATA
 * ========================================
 */


async function loadTable() {

    try {

        const table =
            await t.get('card', 'shared', STORAGE_KEY);

        if (Array.isArray(table)) {
            return table;
        }

        return [];

    } catch (error) {

        console.error('Could not load table:', error);
        return [];

    }

}


/*
 * ========================================
 * CARD INFORMATION
 * ========================================
 */


async function loadCardInfo() {

    try {

        const card =
            await t.card('id', 'name', 'customFieldItems');

        return card || {};

    } catch (error) {

        console.error('Could not load card information:', error);
        return {};

    }

}


/*
 * ========================================
 * BOARD CUSTOM FIELDS
 * ========================================
 */


async function loadCustomFieldDefinitions() {

    try {

        const board =
            await t.board('customFields');

        if (board && Array.isArray(board.customFields)) {
            return board.customFields;
        }

        return [];

    } catch (error) {

        console.error('Could not load custom field definitions:', error);
        return [];

    }

}


/*
 * ========================================
 * FORMAT CURRENCY
 * ========================================
 */


function formatCurrency(value) {

    return '$' + Number(value || 0).toFixed(2);

}


/*
 * ========================================
 * SAFE DISPLAY VALUE
 * ========================================
 *
 * Turns ANY value (string, number, boolean,
 * array, or a Trello-style {text: ...} /
 * {value: ...} object) into readable text.
 *
 * This is the single choke point that makes
 * sure nothing ever renders as
 * "[object Object]" again.
 */


function displayValue(value) {

    if (value === null || value === undefined || value === '') {
        return '—';
    }

    if (typeof value === 'boolean') {
        return value ? 'Yes' : 'No';
    }

    if (Array.isArray(value)) {

        if (value.length === 0) {
            return '—';
        }

        return value
            .map(displayValue)
            .join(', ');

    }

    if (typeof value === 'object') {

        if (value.text !== undefined) {
            return displayValue(value.text);
        }

        if (value.value !== undefined) {
            return displayValue(value.value);
        }

        /*
         * Unknown object shape.
         *
         * Never let a raw object reach
         * textContent — that's what produces
         * "[object Object]".
         */
        return '—';

    }

    return String(value);

}


/*
 * ========================================
 * CUSTOM-SELECTION HELPERS
 * ========================================
 *
 * table.js stores a "Custom" selection as
 * the plain string "Custom" in
 * row.options[optionId], with the typed
 * text saved separately as
 * row.options[optionId + '__custom'].
 *
 * checkboxGroup stores an array and shares
 * the same '__custom' sibling key for
 * whichever entry is "Custom".
 */


function isCustomSelection(value) {

    if (value === undefined || value === null) {
        return false;
    }

    return String(value).trim().toLowerCase() === 'custom';

}


/*
 * ========================================
 * CONDITIONAL FIELDS (dependsOn)
 * ========================================
 *
 * Mirrors the same check table.js uses to
 * show/hide a field. A field whose
 * dependency isn't met (e.g. "Cantidad de
 * Argollas" when Terminación isn't
 * "Argollas") is left out of the print
 * entirely, even if it still has an old
 * value saved from a previous selection.
 */


function isDependencyMet(dependsOn, row) {

    if (!dependsOn || !dependsOn.id) {
        return true;
    }

    const options =
        (row && row.options) || {};

    const currentValue =
        options[dependsOn.id];

    if (Array.isArray(currentValue)) {

        if (dependsOn.equals !== undefined) {
            return currentValue.includes(dependsOn.equals);
        }

        if (Array.isArray(dependsOn.in)) {
            return dependsOn.in.some(function (possibleValue) {
                return currentValue.includes(possibleValue);
            });
        }

        return false;

    }

    if (dependsOn.equals !== undefined) {
        return currentValue === dependsOn.equals;
    }

    if (Array.isArray(dependsOn.in)) {
        return dependsOn.in.indexOf(currentValue) !== -1;
    }

    return true;

}


function resolveRawOptionValue(optionId, row) {

    const options =
        (row && row.options) || {};

    const rawValue =
        options[optionId];

    const customText =
        options[optionId + '__custom'];

    /*
     * checkboxGroup — array of selections.
     * Replace "Custom" with the actual typed
     * text and join everything else as-is.
     */
    if (Array.isArray(rawValue)) {

        if (rawValue.length === 0) {
            return '—';
        }

        return rawValue
            .map(function (item) {

                if (isCustomSelection(item)) {
                    return customText
                        ? ('Custom — ' + customText)
                        : 'Custom';
                }

                return displayValue(item);

            })
            .join(', ');

    }

    /*
     * Single checkbox.
     */
    if (typeof rawValue === 'boolean') {
        return rawValue ? 'Yes' : 'No';
    }

    /*
     * radio / select / radioWithCustom /
     * selectWithCustom — a single "Custom"
     * selection.
     */
    if (isCustomSelection(rawValue)) {
        return customText
            ? ('Custom — ' + customText)
            : 'Custom';
    }

    /*
     * Plain text / number / anything else.
     */
    return displayValue(rawValue);

}


/*
 * ========================================
 * FORMAT CUSTOM FIELD VALUE
 * ========================================
 */


function getCustomFieldValue(field, customFieldItem) {

    if (!customFieldItem) {
        return '—';
    }

    /*
     * ========================================
     * DROPDOWN / LIST
     * ========================================
     */

    if (field.type === 'list') {

        const optionId =
            customFieldItem.idValue;

        if (optionId && Array.isArray(field.options)) {

            const option =
                field.options.find(function (item) {
                    return item.id === optionId;
                });

            if (option) {
                return displayValue(option.value);
            }

        }

        /*
         * Fallback for list items that expose
         * the text directly on the item value.
         */
        if (customFieldItem.value && customFieldItem.value.text !== undefined) {
            return displayValue(customFieldItem.value.text);
        }

        return '—';

    }

    /*
     * ========================================
     * CHECKBOX
     * ========================================
     */

    if (field.type === 'checkbox') {

        if (customFieldItem.value && customFieldItem.value.checked !== undefined) {
            return customFieldItem.value.checked ? 'Yes' : 'No';
        }

        return '—';

    }

    /*
     * ========================================
     * DATE
     * ========================================
     */

    if (field.type === 'date') {

        const dateValue =
            customFieldItem.value && customFieldItem.value.date;

        if (!dateValue) {
            return '—';
        }

        const date =
            new Date(dateValue);

        if (Number.isNaN(date.getTime())) {
            return displayValue(dateValue);
        }

        return date.toLocaleDateString(
            undefined,
            { year: 'numeric', month: 'long', day: 'numeric' }
        );

    }

    /*
     * ========================================
     * NUMBER / TEXT
     * ========================================
     */

    if (customFieldItem.value) {

        if (customFieldItem.value.text !== undefined) {
            return displayValue(customFieldItem.value.text);
        }

        if (customFieldItem.value.number !== undefined) {
            return displayValue(customFieldItem.value.number);
        }

    }

    return '—';

}


/*
 * ========================================
 * FIND CUSTOM FIELD
 * ========================================
 */


function findCustomField(fieldName, definitions) {

    const wanted =
        String(fieldName).trim().toLowerCase();

    return definitions.find(function (field) {
        return String(field.name || '').trim().toLowerCase() === wanted;
    }) || null;

}


/*
 * ========================================
 * FIND CUSTOM FIELD ITEM
 * ========================================
 */


function findCustomFieldItem(fieldId, items) {

    return items.find(function (item) {
        return item.idCustomField === fieldId;
    }) || null;

}


/*
 * ========================================
 * CREATE CUSTOM FIELD ITEM
 * ========================================
 */


function createCustomFieldItem(label, value) {

    const wrapper =
        document.createElement('div');

    wrapper.className =
        'custom-field-item';

    const labelElement =
        document.createElement('span');

    labelElement.className =
        'label';

    labelElement.textContent =
        label;

    const valueElement =
        document.createElement('strong');

    valueElement.className =
        'custom-field-value';

    valueElement.textContent =
        value;

    wrapper.appendChild(labelElement);
    wrapper.appendChild(valueElement);

    return wrapper;

}


/*
 * ========================================
 * RENDER CUSTOM FIELDS
 * ========================================
 */


function renderCustomFields(cardInfo, customFieldDefinitions) {

    const container =
        document.getElementById('customFields');

    if (!container) {
        return;
    }

    container.innerHTML = '';

    const items =
        Array.isArray(cardInfo.customFieldItems)
            ? cardInfo.customFieldItems
            : [];

    PRINT_CUSTOM_FIELDS.forEach(function (fieldName) {

        const field =
            findCustomField(fieldName, customFieldDefinitions);

        if (!field) {

            console.warn('Custom field not found:', fieldName);

            container.appendChild(
                createCustomFieldItem(fieldName, '—')
            );

            return;

        }

        const item =
            findCustomFieldItem(field.id, items);

        const value =
            getCustomFieldValue(field, item);

        container.appendChild(
            createCustomFieldItem(field.name, value)
        );

    });

}


/*
 * ========================================
 * CALCULATE TOTALS
 * ========================================
 */


function calculateTotals(table) {

    let price = 0;

    table.forEach(function (row) {

        const quantity =
            Number(row.quantity) || 0;

        const cost =
            Number(row.cost) || 0;

        price += quantity * cost;

    });

    const subtotal = price;
    const ivu = subtotal * IVU_RATE;
    const total = subtotal + ivu;

    return { price, subtotal, ivu, total };

}


/*
 * ========================================
 * CREATE DETAIL
 * ========================================
 */


function createDetail(label, value) {

    const wrapper =
        document.createElement('div');

    wrapper.className =
        'detail';

    const labelElement =
        document.createElement('span');

    labelElement.className =
        'detail-label';

    labelElement.textContent =
        label;

    const valueElement =
        document.createElement('span');

    valueElement.className =
        'detail-value';

    valueElement.textContent =
        value;

    wrapper.appendChild(labelElement);
    wrapper.appendChild(valueElement);

    return wrapper;

}


/*
 * ========================================
 * CREATE OPTION
 * ========================================
 *
 * `value` is expected to already be a final,
 * display-ready string (resolveRawOptionValue
 * / displayValue already ran on it).
 */


function createOption(label, value, deprecated) {

    const wrapper =
        document.createElement('div');

    wrapper.className =
        'option';

    const labelElement =
        document.createElement('span');

    labelElement.className =
        'option-label';

    labelElement.textContent =
        label + ':';

    const valueElement =
        document.createElement('span');

    valueElement.className =
        'option-value';

    if (deprecated) {
        valueElement.classList.add('deprecated');
    }

    valueElement.textContent =
        deprecated ? (value + ' (DEPRECATED)') : value;

    wrapper.appendChild(labelElement);
    wrapper.appendChild(valueElement);

    return wrapper;

}


/*
 * ========================================
 * FORMAT OPTION LABEL
 * ========================================
 *
 * Fallback label for option ids that aren't
 * (or are no longer) found in products.json.
 */


function formatOptionLabel(id) {

    if (!id) {
        return '';
    }

    return id
        .replace(/_/g, ' ')
        .replace(/\b\w/g, function (letter) {
            return letter.toUpperCase();
        });

}


/*
 * ========================================
 * BUILD OPTION ROWS FOR A PRODUCT CARD
 * ========================================
 *
 * Orders known options the way products.json
 * defines them (with their real labels), then
 * appends any leftover keys still saved on the
 * row but no longer part of the product
 * definition, marked as deprecated.
 *
 * '__custom' sibling keys are never shown as
 * their own row — they're folded into the
 * option they belong to by
 * resolveRawOptionValue().
 */


function buildOptionRows(row, product) {

    const rowOptions =
        (row && row.options && typeof row.options === 'object')
            ? row.options
            : {};

    const orderedKeys = [];

    if (product && Array.isArray(product.options)) {

        product.options.forEach(function (def) {

            if (Object.prototype.hasOwnProperty.call(rowOptions, def.id)) {
                orderedKeys.push(def.id);
            }

        });

    }

    Object.keys(rowOptions).forEach(function (key) {

        if (key.endsWith('__custom')) {
            return;
        }

        if (orderedKeys.indexOf(key) !== -1) {
            return;
        }

        orderedKeys.push(key);

    });

    return orderedKeys
        .filter(function (key) {

            const def =
                findOptionDefinition(key, product);

            /*
             * Skip fields whose dependency
             * isn't currently met (e.g. Argollas
             * amount when Terminación is
             * something else).
             */
            if (def && def.dependsOn) {
                return isDependencyMet(def.dependsOn, row);
            }

            return true;

        })
        .map(function (key) {

            const def =
                findOptionDefinition(key, product);

            const label =
                def && def.label
                    ? def.label
                    : formatOptionLabel(key);

            /*
             * Only mark as deprecated when we
             * actually have a catalog to compare
             * against and the option isn't in it.
             */
            const deprecated =
                product ? !def : false;

            const value =
                resolveRawOptionValue(key, row);

            return { label, value, deprecated };

        });

}


/*
 * ========================================
 * CREATE PRODUCT CARD
 * ========================================
 */


function createProductCard(row, catalog) {

    const card =
        document.createElement('section');

    card.className =
        'product-card';

    /*
     * HEADER
     */
    const header =
        document.createElement('div');

    header.className =
        'product-header';

    const productName =
        document.createElement('div');

    productName.className =
        'product-name';

    productName.textContent =
        row.productName || row.description || 'Untitled Item';

    const status =
        document.createElement('div');

    status.className =
        'product-status';

    if (row.finished) {
        status.classList.add('status-finished');
        status.textContent = '✓ FINISHED';
    } else {
        status.classList.add('status-pending');
        status.textContent = 'PENDING';
    }

    header.appendChild(productName);
    header.appendChild(status);
    card.appendChild(header);

    /*
     * BODY
     */
    const body =
        document.createElement('div');

    body.className =
        'product-body';

    const grid =
        document.createElement('div');

    grid.className =
        'product-grid';

    grid.appendChild(
        createDetail('Quantity', String(Number(row.quantity) || 0))
    );

    grid.appendChild(
        createDetail('Cost', formatCurrency(Number(row.cost) || 0))
    );

    if (row.fileName) {
        grid.appendChild(
            createDetail('File Name', row.fileName)
        );
    }

    body.appendChild(grid);

    /*
     * OPTIONS
     */
    const product =
        getProduct(catalog, row.productId);

    const optionRows =
        buildOptionRows(row, product);

    if (optionRows.length > 0) {

        const optionSection =
            document.createElement('div');

        optionSection.className =
            'option-section';

        const optionTitle =
            document.createElement('div');

        optionTitle.className =
            'option-title';

        optionTitle.textContent =
            'Product Options';

        optionSection.appendChild(optionTitle);

        const optionList =
            document.createElement('div');

        optionList.className =
            'option-list';

        optionRows.forEach(function (option) {

            optionList.appendChild(
                createOption(option.label, option.value, option.deprecated)
            );

        });

        optionSection.appendChild(optionList);
        body.appendChild(optionSection);

    }

    card.appendChild(body);

    return card;

}


/*
 * ========================================
 * RENDER
 * ========================================
 */


function render(table, cardInfo, customFieldDefinitions, catalog) {

    /*
     * Card name.
     */
    const cardName =
        document.getElementById('cardName');

    if (cardName) {
        cardName.textContent = cardInfo.name || 'Untitled Card';
    }

    /*
     * JOB NAME
     */
    const jobId =
        document.getElementById('jobId');

    if (jobId) {
        jobId.textContent = cardInfo.name || 'Untitled Card';
    }

    /*
     * Custom fields.
     */
    renderCustomFields(cardInfo, customFieldDefinitions);

    /*
     * Date.
     */
    const date =
        document.getElementById('date');

    if (date) {
        date.textContent =
            new Date().toLocaleDateString(
                undefined,
                { year: 'numeric', month: 'long', day: 'numeric' }
            );
    }

    /*
     * Item count.
     */
    const itemCount =
        document.getElementById('itemCount');

    const footerItemCount =
        document.getElementById('footerItemCount');

    if (itemCount) {
        itemCount.textContent = table.length;
    }

    if (footerItemCount) {
        footerItemCount.textContent = table.length;
    }

    /*
     * Products.
     */
    const items =
        document.getElementById('items');

    items.innerHTML = '';

    if (table.length === 0) {

        items.innerHTML = `
            <div class="empty">
                No items have been added
                to this job.
            </div>
        `;

    } else {

        table.forEach(function (row) {
            items.appendChild(createProductCard(row, catalog));
        });

    }

    /*
     * Totals.
     */
    const totals =
        calculateTotals(table);

    document.getElementById('price').textContent =
        formatCurrency(totals.price);

    document.getElementById('subtotal').textContent =
        formatCurrency(totals.subtotal);

    document.getElementById('ivu').textContent =
        formatCurrency(totals.ivu);

    document.getElementById('total').textContent =
        formatCurrency(totals.total);

    document.getElementById('ivuLabel').textContent =
        'IVU (' + (IVU_RATE * 100).toFixed(2) + '%)';

    /*
     * Finished count.
     */
    const finished =
        table.filter(function (row) {
            return row.finished === true;
        }).length;

    document.getElementById('finishedCount').textContent =
        finished;

}


/*
 * ========================================
 * PRINT
 * ========================================
 */


function printDocument() {
    window.print();
}


/*
 * ========================================
 * INITIALIZE
 * ========================================
 */


t.render(async function () {

    const [table, cardInfo, customFieldDefinitions, catalog] =
        await Promise.all([
            loadTable(),
            loadCardInfo(),
            loadCustomFieldDefinitions(),
            loadCatalog()
        ]);

    render(table, cardInfo, customFieldDefinitions, catalog);

    const printButton =
        document.getElementById('printButton');

    if (printButton) {
        printButton.addEventListener('click', printDocument);
    }

});
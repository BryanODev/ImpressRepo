const t =
    window.TrelloPowerUp.iframe();


/*
 * ========================================
 * SETTINGS
 * ========================================
 */


/*
 * Custom fields to include in the
 * printed INFO CARD.
 *
 * These names should match the
 * Trello Custom Field names.
 *
 * The comparison is case-insensitive.
 *
 * Example:
 *
 * [
 *     'Customer',
 *     'Salesperson',
 *     'Quantity',
 *     'Material',
 *     'Size'
 * ]
 *
 *
 * IMPORTANT:
 *
 * The order here is the order
 * they will appear in the print.
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
 * Keep this synchronized with table.js.
 *
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
 * LOAD DATA
 * ========================================
 */


async function loadTable() {

    try {

        const table =
            await t.get(
                'card',
                'shared',
                STORAGE_KEY
            );


        if (Array.isArray(table)) {

            return table;

        }


        return [];

    } catch (error) {

        console.error(
            'Could not load table:',
            error
        );


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

        /*
         * customFieldItems gives us the
         * values stored on this card.
         */
        const card =
            await t.card(
                'id',
                'name',
                'customFieldItems'
            );


        return card || {};

    } catch (error) {

        console.error(
            'Could not load card information:',
            error
        );


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

        /*
         * Custom Field definitions live
         * at the board level.
         */
        const board =
            await t.board(
                'customFields'
            );


        if (
            board &&
            Array.isArray(
                board.customFields
            )
        ) {

            return board.customFields;

        }


        return [];

    } catch (error) {

        console.error(
            'Could not load custom field definitions:',
            error
        );


        return [];

    }

}


/*
 * ========================================
 * FORMAT CURRENCY
 * ========================================
 */


function formatCurrency(value) {

    return '$' +
        Number(value || 0)
            .toFixed(2);

}


/*
 * ========================================
 * FORMAT OPTION
 * ========================================
 */


function formatOptionValue(value) {

    if (
        typeof value === 'boolean'
    ) {

        return value
            ? 'Yes'
            : 'No';

    }


    if (
        value === null ||
        value === undefined ||
        value === ''
    ) {

        return '—';

    }


    return String(value);

}


/*
 * ========================================
 * FORMAT CUSTOM FIELD VALUE
 * ========================================
 */


/*
 * Trello customFieldItems can store
 * different value types depending on
 * the custom field definition.
 */
function getCustomFieldValue(
    field,
    customFieldItem
) {

    if (!customFieldItem) {

        return '—';

    }


    /*
     * CHECKBOX
     */
    if (
        field.type ===
        'checkbox'
    ) {

        if (
            customFieldItem.value &&
            customFieldItem.value.checked !==
            undefined
        ) {

            return customFieldItem.value.checked
                ? 'Yes'
                : 'No';

        }


        return '—';

    }


    /*
     * DATE
     */
    if (
        field.type ===
        'date'
    ) {

        const dateValue =
            customFieldItem.value &&
            customFieldItem.value.date;


        if (!dateValue) {

            return '—';

        }


        const date =
            new Date(
                dateValue
            );


        if (
            Number.isNaN(
                date.getTime()
            )
        ) {

            return dateValue;

        }


        return date.toLocaleDateString(
            undefined,
            {
                year:
                    'numeric',

                month:
                    'long',

                day:
                    'numeric'
            }
        );

    }


    /*
     * LIST
     */
    if (
        field.type ===
        'list'
    ) {

        const optionId =
            customFieldItem.idValue;


        if (
            optionId &&
            Array.isArray(
                field.options
            )
        ) {

            const option =
                field.options.find(
                    function (item) {

                        return (
                            item.id ===
                            optionId
                        );

                    }
                );


            if (option) {

                return option.value ||
                    '—';

            }

        }


        return '—';

    }


    /*
     * NUMBER / TEXT
     */
    if (
        customFieldItem.value
    ) {

        if (
            customFieldItem.value.text !==
            undefined
        ) {

            return formatOptionValue(
                customFieldItem.value.text
            );

        }


        if (
            customFieldItem.value.number !==
            undefined
        ) {

            return formatOptionValue(
                customFieldItem.value.number
            );

        }

    }


    return '—';

}


/*
 * ========================================
 * FIND CUSTOM FIELD
 * ========================================
 */


/*
 * Finds a custom field by name.
 *
 * Case-insensitive.
 */
function findCustomField(
    fieldName,
    definitions
) {

    const wanted =
        String(
            fieldName
        )
            .trim()
            .toLowerCase();


    return definitions.find(
        function (field) {

            return (
                String(
                    field.name || ''
                )
                    .trim()
                    .toLowerCase() ===
                wanted
            );

        }
    ) || null;

}


/*
 * ========================================
 * FIND CUSTOM FIELD ITEM
 * ========================================
 */


function findCustomFieldItem(
    fieldId,
    items
) {

    return items.find(
        function (item) {

            return (
                item.idCustomField ===
                fieldId
            );

        }
    ) || null;

}


/*
 * ========================================
 * CREATE CUSTOM FIELD ITEM
 * ========================================
 */


function createCustomFieldItem(
    label,
    value
) {

    const wrapper =
        document.createElement(
            'div'
        );


    wrapper.className =
        'custom-field-item';


    const labelElement =
        document.createElement(
            'span'
        );


    labelElement.className =
        'label';


    labelElement.textContent =
        label;


    const valueElement =
        document.createElement(
            'strong'
        );


    valueElement.className =
        'custom-field-value';


    valueElement.textContent =
        value;


    wrapper.appendChild(
        labelElement
    );


    wrapper.appendChild(
        valueElement
    );


    return wrapper;

}


/*
 * ========================================
 * RENDER CUSTOM FIELDS
 * ========================================
 */


function renderCustomFields(
    cardInfo,
    customFieldDefinitions
) {

    const container =
        document.getElementById(
            'customFields'
        );


    if (!container) {

        return;

    }


    container.innerHTML = '';


    const items =
        Array.isArray(
            cardInfo.customFieldItems
        )
            ? cardInfo.customFieldItems
            : [];


    /*
     * Every name in PRINT_CUSTOM_FIELDS
     * gets its own printed field.
     */
    PRINT_CUSTOM_FIELDS.forEach(
        function (fieldName) {

            const field =
                findCustomField(
                    fieldName,
                    customFieldDefinitions
                );


            /*
             * The requested field doesn't
             * exist on this board.
             */
            if (!field) {

                console.warn(
                    'Custom field not found:',
                    fieldName
                );


                container.appendChild(
                    createCustomFieldItem(
                        fieldName,
                        '—'
                    )
                );


                return;

            }


            const item =
                findCustomFieldItem(
                    field.id,
                    items
                );


            const value =
                getCustomFieldValue(
                    field,
                    item
                );


            container.appendChild(
                createCustomFieldItem(
                    field.name,
                    value
                )
            );

        }
    );

}


/*
 * ========================================
 * CALCULATE TOTALS
 * ========================================
 */


function calculateTotals(table) {

    let price = 0;


    table.forEach(
        function (row) {

            const quantity =
                Number(row.quantity) || 0;


            const cost =
                Number(row.cost) || 0;


            price +=
                quantity * cost;

        }
    );


    const subtotal =
        price;


    const ivu =
        subtotal * IVU_RATE;


    const total =
        subtotal + ivu;


    return {

        price,
        subtotal,
        ivu,
        total

    };

}


/*
 * ========================================
 * CREATE DETAIL
 * ========================================
 */


function createDetail(
    label,
    value
) {

    const wrapper =
        document.createElement(
            'div'
        );


    wrapper.className =
        'detail';


    const labelElement =
        document.createElement(
            'span'
        );


    labelElement.className =
        'detail-label';


    labelElement.textContent =
        label;


    const valueElement =
        document.createElement(
            'span'
        );


    valueElement.className =
        'detail-value';


    valueElement.textContent =
        value;


    wrapper.appendChild(
        labelElement
    );


    wrapper.appendChild(
        valueElement
    );


    return wrapper;

}


/*
 * ========================================
 * CREATE OPTION
 * ========================================
 */


function createOption(
    label,
    value,
    deprecated
) {

    const wrapper =
        document.createElement(
            'div'
        );


    wrapper.className =
        'option';


    const labelElement =
        document.createElement(
            'span'
        );


    labelElement.className =
        'option-label';


    labelElement.textContent =
        label + ':';


    const valueElement =
        document.createElement(
            'span'
        );


    valueElement.className =
        'option-value';


    if (deprecated) {

        valueElement.classList.add(
            'deprecated'
        );

    }


    valueElement.textContent =
        formatOptionValue(
            value
        );


    if (deprecated) {

        valueElement.textContent +=
            ' (DEPRECATED)';

    }


    wrapper.appendChild(
        labelElement
    );


    wrapper.appendChild(
        valueElement
    );


    return wrapper;

}


/*
 * ========================================
 * CREATE PRODUCT CARD
 * ========================================
 */


function createProductCard(row) {

    const card =
        document.createElement(
            'section'
        );


    card.className =
        'product-card';


    /*
     * HEADER
     */
    const header =
        document.createElement(
            'div'
        );


    header.className =
        'product-header';


    const productName =
        document.createElement(
            'div'
        );


    productName.className =
        'product-name';


    productName.textContent =
        row.productName ||
        row.description ||
        'Untitled Item';


    const status =
        document.createElement(
            'div'
        );


    status.className =
        'product-status';


    if (row.finished) {

        status.classList.add(
            'status-finished'
        );


        status.textContent =
            '✓ FINISHED';

    } else {

        status.classList.add(
            'status-pending'
        );


        status.textContent =
            'PENDING';

    }


    header.appendChild(
        productName
    );


    header.appendChild(
        status
    );


    card.appendChild(
        header
    );


    /*
     * BODY
     */
    const body =
        document.createElement(
            'div'
        );


    body.className =
        'product-body';


    /*
     * Basic information.
     */
    const grid =
        document.createElement(
            'div'
        );


    grid.className =
        'product-grid';


    grid.appendChild(
        createDetail(
            'Quantity',
            String(
                Number(row.quantity) || 0
            )
        )
    );


    grid.appendChild(
        createDetail(
            'Cost',
            formatCurrency(
                Number(row.cost) || 0
            )
        )
    );


    if (row.fileName) {

        grid.appendChild(
            createDetail(
                'File Name',
                row.fileName
            )
        );

    }


    body.appendChild(
        grid
    );


    /*
     * OPTIONS
     */
    if (
        row.options &&
        typeof row.options === 'object' &&
        Object.keys(row.options).length > 0
    ) {

        const optionSection =
            document.createElement(
                'div'
            );


        optionSection.className =
            'option-section';


        const optionTitle =
            document.createElement(
                'div'
            );


        optionTitle.className =
            'option-title';


        optionTitle.textContent =
            'Product Options';


        optionSection.appendChild(
            optionTitle
        );


        const optionList =
            document.createElement(
                'div'
            );


        optionList.className =
            'option-list';


        /*
         * We intentionally use the
         * SAVED option data.
         *
         * This means old options survive
         * catalog changes.
         */
        Object.keys(
            row.options
        ).forEach(
            function (optionId) {

                optionList.appendChild(
                    createOption(
                        formatOptionLabel(
                            optionId
                        ),
                        row.options[
                            optionId
                        ],
                        false
                    )
                );

            }
        );


        optionSection.appendChild(
            optionList
        );


        body.appendChild(
            optionSection
        );

    }


    card.appendChild(
        body
    );


    return card;

}


/*
 * ========================================
 * FORMAT OPTION LABEL
 * ========================================
 */


function formatOptionLabel(id) {

    if (!id) {

        return '';

    }


    return id
        .replace(
            /_/g,
            ' '
        )
        .replace(
            /\b\w/g,
            function (letter) {

                return letter.toUpperCase();

            }
        );

}


/*
 * ========================================
 * RENDER
 * ========================================
 */


function render(
    table,
    cardInfo,
    customFieldDefinitions
) {

    /*
     * Card name.
     */
    const cardName =
        document.getElementById(
            'cardName'
        );


    if (cardName) {

        cardName.textContent =
            cardInfo.name ||
            'Untitled Card';

    }


    /*
     * JOB NAME
     *
     * Instead of using the Trello
     * internal card ID, use the
     * actual card name.
     */
    const jobId =
        document.getElementById(
            'jobId'
        );


    if (jobId) {

        jobId.textContent =
            cardInfo.name ||
            'Untitled Card';

    }


    /*
     * Custom fields.
     */
    renderCustomFields(
        cardInfo,
        customFieldDefinitions
    );


    /*
     * Date.
     */
    const date =
        document.getElementById(
            'date'
        );


    if (date) {

        date.textContent =
            new Date()
                .toLocaleDateString(
                    undefined,
                    {
                        year:
                            'numeric',

                        month:
                            'long',

                        day:
                            'numeric'
                    }
                );

    }


    /*
     * Item count.
     */
    const itemCount =
        document.getElementById(
            'itemCount'
        );


    const footerItemCount =
        document.getElementById(
            'footerItemCount'
        );


    if (itemCount) {

        itemCount.textContent =
            table.length;

    }


    if (footerItemCount) {

        footerItemCount.textContent =
            table.length;

    }


    /*
     * Products.
     */
    const items =
        document.getElementById(
            'items'
        );


    items.innerHTML = '';


    if (table.length === 0) {

        items.innerHTML = `

            <div class="empty">

                No items have been added
                to this job.

            </div>

        `;

    } else {

        table.forEach(
            function (row) {

                items.appendChild(
                    createProductCard(
                        row
                    )
                );

            }
        );

    }


    /*
     * Totals.
     */
    const totals =
        calculateTotals(
            table
        );


    document.getElementById(
        'price'
    ).textContent =
        formatCurrency(
            totals.price
        );


    document.getElementById(
        'subtotal'
    ).textContent =
        formatCurrency(
            totals.subtotal
        );


    document.getElementById(
        'ivu'
    ).textContent =
        formatCurrency(
            totals.ivu
        );


    document.getElementById(
        'total'
    ).textContent =
        formatCurrency(
            totals.total
        );


    document.getElementById(
        'ivuLabel'
    ).textContent =
        'IVU (' +
        (
            IVU_RATE * 100
        ).toFixed(2) +
        '%)';


    /*
     * Finished count.
     */
    const finished =
        table.filter(
            function (row) {

                return row.finished === true;

            }
        ).length;


    document.getElementById(
        'finishedCount'
    ).textContent =
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


    /*
     * Load everything at once.
     */
    const [
        table,
        cardInfo,
        customFieldDefinitions
    ] =
        await Promise.all([

            loadTable(),

            loadCardInfo(),

            loadCustomFieldDefinitions()

        ]);


    render(
        table,
        cardInfo,
        customFieldDefinitions
    );


    const printButton =
        document.getElementById(
            'printButton'
        );


    if (printButton) {

        printButton.addEventListener(
            'click',
            printDocument
        );

    }


});
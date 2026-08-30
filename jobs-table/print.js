const t =
    window.TrelloPowerUp.iframe();


/*
 * ========================================
 * SETTINGS
 * ========================================
 */

const STORAGE_KEY =
    'itemsTable';


const IVU_RATE =
    0.115;


/*
 * ========================================
 * DATA
 * ========================================
 */

let table = [];

let catalog = null;


/*
 * ========================================
 * LOAD DATA
 * ========================================
 */

async function loadData() {

    try {

        /*
         * Load saved table.
         */

        const savedTable =
            await t.get(
                'card',
                'shared',
                STORAGE_KEY
            );


        if (Array.isArray(savedTable)) {

            table =
                savedTable;

        } else {

            table = [];

        }


        /*
         * Load product catalog.
         */

        const catalogResponse =
            await fetch(
                './products.json',
                {
                    cache: 'no-cache'
                }
            );


        if (!catalogResponse.ok) {

            throw new Error(
                'Could not load products.json'
            );

        }


        catalog =
            await catalogResponse.json();


        if (
            !catalog ||
            !Array.isArray(
                catalog.products
            )
        ) {

            throw new Error(
                'Invalid products.json format'
            );

        }


        /*
         * Load card information.
         */

        await loadCardInfo();


        /*
         * Render everything.
         */

        render();


    } catch (error) {

        console.error(
            'Could not load print data:',
            error
        );

    }

}


/*
 * ========================================
 * LOAD CARD INFO
 * ========================================
 */

async function loadCardInfo() {

    try {

        /*
         * Card name.
         */

        const cardName =
            await t.get(
                'card',
                'name'
            );


        const cardNameElement =
            document.getElementById(
                'cardName'
            );


        if (cardNameElement) {

            cardNameElement.textContent =
                cardName ||
                '—';

        }


        /*
         * Card ID.
         */

        const cardId =
            await t.get(
                'card',
                'id'
            );


        const jobIdElement =
            document.getElementById(
                'jobId'
            );


        if (jobIdElement) {

            jobIdElement.textContent =
                cardId ||
                '—';

        }


        /*
         * Date.
         */

        const dateElement =
            document.getElementById(
                'date'
            );


        if (dateElement) {

            const now =
                new Date();


            dateElement.textContent =
                now.toLocaleDateString(
                    'en-US',
                    {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit'
                    }
                );

        }


    } catch (error) {

        console.error(
            'Could not load card information:',
            error
        );

    }

}


/*
 * ========================================
 * GET PRODUCT
 * ========================================
 */

function getProduct(productId) {

    if (!catalog) {

        return null;

    }


    return catalog.products.find(
        function (product) {

            return (
                product.id ===
                productId
            );

        }
    ) || null;

}


/*
 * ========================================
 * FORMAT CURRENCY
 * ========================================
 */

function formatCurrency(value) {

    return '$' +
        Number(
            value || 0
        ).toFixed(2);

}


/*
 * ========================================
 * IS CUSTOM OPTION
 * ========================================
 */

function isCustomOption(value) {

    return String(
        value
    )
        .trim()
        .toLowerCase() ===
        'custom';

}


/*
 * ========================================
 * GET CUSTOM VALUE
 * ========================================
 */

function getCustomValue(
    row,
    optionDefinition
) {

    if (
        !row.options ||
        typeof row.options !== 'object'
    ) {

        return '';

    }


    return (
        row.options[
            optionDefinition.id +
            '__custom'
        ] ||
        ''
    );

}


/*
 * ========================================
 * FORMAT OPTION VALUE
 * ========================================
 */

function formatOptionValue(
    row,
    optionDefinition
) {

    if (
        !row.options ||
        typeof row.options !== 'object'
    ) {

        return '—';

    }


    const value =
        row.options[
            optionDefinition.id
        ];


    /*
     * ========================================
     * CHECKBOX — YES / NO
     * ========================================
     */

    if (
        optionDefinition.type ===
        'checkbox'
    ) {

        return value
            ? 'Yes'
            : 'No';

    }


    /*
     * ========================================
     * CHECKBOX GROUP
     * ========================================
     *
     * Multiple values can be selected.
     *
     * Custom can contain its own text.
     */

    if (
        optionDefinition.type ===
        'checkboxGroup'
    ) {

        if (
            !Array.isArray(value) ||
            value.length === 0
        ) {

            return '—';

        }


        const customValue =
            getCustomValue(
                row,
                optionDefinition
            );


        return value.map(
            function (selectedValue) {

                if (
                    isCustomOption(
                        selectedValue
                    )
                ) {

                    if (customValue) {

                        return (
                            'Custom — ' +
                            customValue
                        );

                    }


                    return 'Custom';

                }


                return selectedValue;

            }
        ).join(', ');

    }


    /*
     * ========================================
     * RADIO
     * ========================================
     *
     * Radio now supports Custom directly.
     */

    if (
        optionDefinition.type ===
        'radio'
    ) {

        if (
            isCustomOption(value)
        ) {

            const customValue =
                getCustomValue(
                    row,
                    optionDefinition
                );


            if (customValue) {

                return (
                    'Custom — ' +
                    customValue
                );

            }


            return 'Custom';

        }


        return value || '—';

    }


    /*
     * ========================================
     * SELECT / DROPDOWN
     * ========================================
     *
     * Dropdown can also contain Custom.
     */

    if (
        optionDefinition.type ===
        'select'
    ) {

        if (
            isCustomOption(value)
        ) {

            const customValue =
                getCustomValue(
                    row,
                    optionDefinition
                );


            if (customValue) {

                return (
                    'Custom — ' +
                    customValue
                );

            }


            return 'Custom';

        }


        return value || '—';

    }


    /*
     * ========================================
     * OLD RADIO WITH CUSTOM
     * ========================================
     *
     * Compatibility for old saved products.
     */

    if (
        optionDefinition.type ===
        'radioWithCustom'
    ) {

        if (
            isCustomOption(value)
        ) {

            const customValue =
                getCustomValue(
                    row,
                    optionDefinition
                );


            if (customValue) {

                return (
                    'Custom — ' +
                    customValue
                );

            }


            return 'Custom';

        }


        return value || '—';

    }


    /*
     * ========================================
     * OLD SELECT WITH CUSTOM
     * ========================================
     *
     * Compatibility for old saved data.
     */

    if (
        optionDefinition.type ===
        'selectWithCustom'
    ) {

        if (
            value &&
            typeof value === 'object'
        ) {

            const selected =
                value.value ||
                '';


            const custom =
                value.custom ||
                '';


            if (
                isCustomOption(
                    selected
                )
            ) {

                return custom
                    ? 'Custom — ' + custom
                    : 'Custom';

            }


            return selected ||
                '—';

        }


        return value ||
            '—';

    }


    /*
     * ========================================
     * EMPTY VALUE
     * ========================================
     */

    if (
        value === undefined ||
        value === null ||
        value === ''
    ) {

        return '—';

    }


    /*
     * ========================================
     * DEFAULT
     * ========================================
     */

    return String(value);

}


/*
 * ========================================
 * CREATE PRINT OPTION
 * ========================================
 */

function createPrintOption(
    row,
    optionDefinition
) {

    const wrapper =
        document.createElement(
            'div'
        );


    wrapper.className =
        'print-option';


    const label =
        document.createElement(
            'span'
        );


    label.className =
        'print-option-label';


    label.textContent =
        optionDefinition.label +
        ':';


    const value =
        document.createElement(
            'span'
        );


    value.className =
        'print-option-value';


    value.textContent =
        formatOptionValue(
            row,
            optionDefinition
        );


    wrapper.appendChild(
        label
    );


    wrapper.appendChild(
        value
    );


    return wrapper;

}


/*
 * ========================================
 * CREATE PRODUCT OPTIONS
 * ========================================
 */

function createPrintOptions(
    row,
    product
) {

    const container =
        document.createElement(
            'div'
        );


    container.className =
        'print-options';


    if (
        !product ||
        !Array.isArray(
            product.options
        )
    ) {

        return container;

    }


    product.options.forEach(
        function (optionDefinition) {

            container.appendChild(
                createPrintOption(
                    row,
                    optionDefinition
                )
            );

        }
    );


    return container;

}


/*
 * ========================================
 * RENDER TABLE
 * ========================================
 */

function render() {

    /*
     * IMPORTANT:
     *
     * print.html uses:
     *
     * <main id="items">
     *
     * NOT #tableBody.
     */

    const body =
        document.getElementById(
            'items'
        );


    if (!body) {

        console.error(
            'Print page: #items element not found.'
        );


        return;

    }


    body.innerHTML = '';


    /*
     * ========================================
     * EMPTY TABLE
     * ========================================
     */

    if (table.length === 0) {

        const empty =
            document.createElement(
                'div'
            );


        empty.className =
            'empty';


        empty.textContent =
            'No items.';


        body.appendChild(
            empty
        );


        updateTotals();


        updateItemCounts();


        return;

    }


    /*
     * ========================================
     * RENDER EACH ROW
     * ========================================
     */

    table.forEach(
        function (row) {

            const item =
                document.createElement(
                    'section'
                );


            item.className =
                'print-item';


            /*
             * ========================================
             * ITEM HEADER
             * ========================================
             */

            const itemHeader =
                document.createElement(
                    'div'
                );


            itemHeader.className =
                'print-item-header';


            /*
             * Finished.
             */

            const finished =
                document.createElement(
                    'span'
                );


            finished.className =
                'print-item-finished';


            finished.textContent =
                row.finished
                    ? '✓'
                    : '';


            /*
             * Quantity.
             */

            const quantity =
                document.createElement(
                    'span'
                );


            quantity.className =
                'print-item-quantity';


            quantity.textContent =
                'Qty: ' +
                (
                    row.quantity ??
                    0
                );


            /*
             * Product name.
             */

            const productName =
                document.createElement(
                    'strong'
                );


            const product =
                getProduct(
                    row.productId
                );


            productName.textContent =
                product
                    ? product.name
                    : (
                        row.productName ||
                        row.productId ||
                        '—'
                    );


            itemHeader.appendChild(
                finished
            );


            itemHeader.appendChild(
                quantity
            );


            itemHeader.appendChild(
                productName
            );


            item.appendChild(
                itemHeader
            );


            /*
             * ========================================
             * OPTIONS
             * ========================================
             */

            const options =
                createPrintOptions(
                    row,
                    product
                );


            item.appendChild(
                options
            );


            /*
             * ========================================
             * ITEM FOOTER
             * ========================================
             */

            const itemFooter =
                document.createElement(
                    'div'
                );


            itemFooter.className =
                'print-item-footer';


            /*
             * Cost.
             */

            const cost =
                Number(
                    row.cost
                ) || 0;


            const costElement =
                document.createElement(
                    'span'
                );


            costElement.textContent =
                'Cost: ' +
                formatCurrency(
                    cost
                );


            /*
             * File.
             */

            const fileElement =
                document.createElement(
                    'span'
                );


            fileElement.textContent =
                'File: ' +
                (
                    row.fileName ||
                    '—'
                );


            itemFooter.appendChild(
                costElement
            );


            itemFooter.appendChild(
                fileElement
            );


            item.appendChild(
                itemFooter
            );


            body.appendChild(
                item
            );

        }
    );


    /*
     * Update totals.
     */

    updateTotals();


    /*
     * Update item counters.
     */

    updateItemCounts();

}


/*
 * ========================================
 * CALCULATE TOTALS
 * ========================================
 */

function calculateTotals() {

    let subtotal = 0;


    table.forEach(
        function (row) {

            const quantity =
                Number(
                    row.quantity
                ) || 0;


            const cost =
                Number(
                    row.cost
                ) || 0;


            subtotal +=
                quantity *
                cost;

        }
    );


    const ivu =
        subtotal *
        IVU_RATE;


    const total =
        subtotal +
        ivu;


    return {

        subtotal,
        ivu,
        total

    };

}


/*
 * ========================================
 * UPDATE TOTALS
 * ========================================
 */

function updateTotals() {

    const totals =
        calculateTotals();


    /*
     * Price.
     *
     * Your print HTML contains
     * #price, so populate it too.
     */

    const priceElement =
        document.getElementById(
            'price'
        );


    if (priceElement) {

        priceElement.textContent =
            formatCurrency(
                totals.subtotal
            );

    }


    /*
     * SubTotal.
     */

    const subtotalElement =
        document.getElementById(
            'subtotal'
        );


    if (subtotalElement) {

        subtotalElement.textContent =
            formatCurrency(
                totals.subtotal
            );

    }


    /*
     * IVU.
     */

    const ivuElement =
        document.getElementById(
            'ivu'
        );


    if (ivuElement) {

        ivuElement.textContent =
            formatCurrency(
                totals.ivu
            );

    }


    /*
     * Total.
     */

    const totalElement =
        document.getElementById(
            'total'
        );


    if (totalElement) {

        totalElement.textContent =
            formatCurrency(
                totals.total
            );

    }


    /*
     * IVU label.
     */

    const ivuLabel =
        document.getElementById(
            'ivuLabel'
        );


    if (ivuLabel) {

        ivuLabel.textContent =
            'IVU (' +
            (
                IVU_RATE * 100
            ).toFixed(2) +
            '%)';

    }

}


/*
 * ========================================
 * UPDATE ITEM COUNTS
 * ========================================
 */

function updateItemCounts() {

    const itemCount =
        table.length;


    const finishedCount =
        table.filter(
            function (row) {

                return Boolean(
                    row.finished
                );

            }
        ).length;


    /*
     * Info-card item count.
     */

    const itemCountElement =
        document.getElementById(
            'itemCount'
        );


    if (itemCountElement) {

        itemCountElement.textContent =
            itemCount;

    }


    /*
     * Footer total count.
     */

    const footerItemCount =
        document.getElementById(
            'footerItemCount'
        );


    if (footerItemCount) {

        footerItemCount.textContent =
            itemCount;

    }


    /*
     * Footer finished count.
     */

    const finishedCountElement =
        document.getElementById(
            'finishedCount'
        );


    if (finishedCountElement) {

        finishedCountElement.textContent =
            finishedCount;

    }

}


/*
 * ========================================
 * PRINT
 * ========================================
 */

function printPage() {

    window.print();

}


/*
 * ========================================
 * INITIALIZE
 * ========================================
 */

document.addEventListener(
    'DOMContentLoaded',
    async function () {

        const printButton =
            document.getElementById(
                'printButton'
            );


        if (printButton) {

            printButton.addEventListener(
                'click',
                printPage
            );

        }


        await loadData();

    }
);
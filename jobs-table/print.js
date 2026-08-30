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

        const savedTable =
            await t.get(
                'card',
                'shared',
                STORAGE_KEY
            );


        if (Array.isArray(savedTable)) {

            table = savedTable;

        } else {

            table = [];

        }


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
 * GET PRODUCT
 * ========================================
 */

function getProduct(productId) {

    if (!catalog) {

        return null;

    }


    return catalog.products.find(
        function (product) {

            return product.id === productId;

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
        Number(value || 0).toFixed(2);

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
     * CHECKBOX
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
     * RADIO WITH CUSTOM
     * ========================================
     */

    if (
        optionDefinition.type ===
        'radioWithCustom'
    ) {

        if (
            value ===
            'Custom'
        ) {

            const customValue =
                row.options[
                    optionDefinition.id +
                    '__custom'
                ] || '';


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
     * RADIO
     * ========================================
     */

    if (
        optionDefinition.type ===
        'radio'
    ) {

        return value || '—';

    }


    /*
     * ========================================
     * SELECT WITH CUSTOM
     *
     * Kept for compatibility with
     * older saved data.
     * ========================================
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
                value.value || '';


            const custom =
                value.custom || '';


            if (
                selected ===
                'Custom'
            ) {

                return custom
                    ? 'Custom — ' + custom
                    : 'Custom';

            }


            return selected || '—';

        }


        return value || '—';

    }


    /*
     * ========================================
     * EVERYTHING ELSE
     * ========================================
     */

    if (
        value ===
        undefined ||
        value ===
        null ||
        value ===
        ''
    ) {

        return '—';

    }


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

    const body =
        document.getElementById(
            'tableBody'
        );


    if (!body) {

        return;

    }


    body.innerHTML = '';


    table.forEach(
        function (row) {

            const tr =
                document.createElement(
                    'tr'
                );


            /*
             * ========================================
             * FINISHED
             * ========================================
             */

            const checkTd =
                document.createElement(
                    'td'
                );


            checkTd.className =
                'check';


            const checkbox =
                document.createElement(
                    'input'
                );


            checkbox.type =
                'checkbox';


            checkbox.checked =
                Boolean(
                    row.finished
                );


            checkbox.disabled =
                true;


            checkTd.appendChild(
                checkbox
            );


            tr.appendChild(
                checkTd
            );


            /*
             * ========================================
             * QUANTITY
             * ========================================
             */

            const quantityTd =
                document.createElement(
                    'td'
                );


            quantityTd.className =
                'quantity';


            quantityTd.textContent =
                row.quantity ??
                '';


            tr.appendChild(
                quantityTd
            );


            /*
             * ========================================
             * PRODUCT
             * ========================================
             */

            const productTd =
                document.createElement(
                    'td'
                );


            productTd.className =
                'product';


            const product =
                getProduct(
                    row.productId
                );


            productTd.textContent =
                product
                    ? product.name
                    : (
                        row.productName ||
                        row.productId ||
                        '—'
                    );


            tr.appendChild(
                productTd
            );


            /*
             * ========================================
             * OPTIONS
             * ========================================
             */

            const optionsTd =
                document.createElement(
                    'td'
                );


            optionsTd.className =
                'options';


            optionsTd.appendChild(
                createPrintOptions(
                    row,
                    product
                )
            );


            tr.appendChild(
                optionsTd
            );


            /*
             * ========================================
             * COST
             * ========================================
             */

            const costTd =
                document.createElement(
                    'td'
                );


            costTd.className =
                'cost';


            const cost =
                Number(
                    row.cost
                ) || 0;


            costTd.textContent =
                formatCurrency(
                    cost
                );


            tr.appendChild(
                costTd
            );


            /*
             * ========================================
             * FILE
             * ========================================
             */

            const fileTd =
                document.createElement(
                    'td'
                );


            fileTd.className =
                'file';


            fileTd.textContent =
                row.fileName ||
                '—';


            tr.appendChild(
                fileTd
            );


            body.appendChild(
                tr
            );

        }
    );


    updateTotals();

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
                quantity * cost;

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


    const subtotalElement =
        document.getElementById(
            'subtotal'
        );


    const ivuElement =
        document.getElementById(
            'ivu'
        );


    const totalElement =
        document.getElementById(
            'total'
        );


    const ivuLabel =
        document.getElementById(
            'ivuLabel'
        );


    if (subtotalElement) {

        subtotalElement.textContent =
            formatCurrency(
                totals.subtotal
            );

    }


    if (ivuElement) {

        ivuElement.textContent =
            formatCurrency(
                totals.ivu
            );

    }


    if (totalElement) {

        totalElement.textContent =
            formatCurrency(
                totals.total
            );

    }


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
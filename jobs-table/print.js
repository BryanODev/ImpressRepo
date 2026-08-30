const t =
    window.TrelloPowerUp.iframe();


/*
 * ========================================
 * SETTINGS
 * ========================================
 */


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

        const card =
            await t.card(
                'name',
                'id'
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
    cardInfo
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
     * Job ID.
     *
     * Using the Trello card ID.
     */
    const jobId =
        document.getElementById(
            'jobId'
        );


    if (jobId) {

        jobId.textContent =
            cardInfo.id
                ? cardInfo.id
                    .substring(0, 8)
                    .toUpperCase()
                : '—';

    }


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


    const [
        table,
        cardInfo
    ] =
        await Promise.all([

            loadTable(),

            loadCardInfo()

        ]);


    render(
        table,
        cardInfo
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
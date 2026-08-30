const t = window.TrelloPowerUp.iframe();

const STORAGE_KEY = 'itemsTable';


async function loadTable() {

    try {

        const savedTable = await t.get(
            'card',
            'shared',
            STORAGE_KEY
        );


        if (Array.isArray(savedTable)) {

            return savedTable;

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
 * Calculate Price.
 *
 * Price = Quantity × Cost
 */
function calculatePrice(table) {

    let price = 0;


    table.forEach(function (row) {

        const quantity =
            Number(row.quantity) || 0;

        const cost =
            Number(row.cost) || 0;


        price +=
            quantity * cost;

    });


    return price;

}


/*
 * Format currency.
 */
function formatCurrency(value) {

    return '$' + value.toFixed(2);

}


/*
 * Render preview.
 */
function render(table) {

    const itemsElement =
        document.getElementById('items');


    const progressElement =
        document.getElementById('progress');


    const priceElement =
        document.getElementById('price');


    itemsElement.innerHTML = '';


    /*
     * Empty state.
     */
    if (table.length === 0) {

        itemsElement.innerHTML = `

            <div class="empty">
                No items yet.
            </div>

        `;


        progressElement.textContent =
            '0 / 0 finished';


        priceElement.textContent =
            '$0.00';


        return;

    }


    /*
     * Count finished items.
     */
    const finishedCount =
        table.filter(function (row) {

            return row.finished === true;

        }).length;


    progressElement.textContent =
        finishedCount +
        ' / ' +
        table.length +
        ' finished';


    /*
     * Render descriptions.
     */
    table.forEach(function (row) {

        const item =
            document.createElement('div');


        item.className =
            'item';


        /*
         * Checkbox.
         */
        const checkbox =
            document.createElement('input');


        checkbox.type =
            'checkbox';


        checkbox.className =
            'checkbox';


        checkbox.checked =
            Boolean(row.finished);


        checkbox.disabled =
            true;


        /*
         * Description.
         */
        const description =
            document.createElement('span');


        description.className =
            'description';


        if (row.finished) {

            description.classList.add(
                'finished'
            );

        }


        description.textContent =
            row.description ||
            'Untitled item';


        item.appendChild(
            checkbox
        );


        item.appendChild(
            description
        );


        itemsElement.appendChild(
            item
        );

    });


    /*
     * Price.
     */
    const price =
        calculatePrice(table);


    priceElement.textContent =
        formatCurrency(price);

}


/*
 * Open full table.
 */
async function openTable() {

    await t.modal({

        title: 'Task Table',

        url: './table.html',

        height: 700,

        fullscreen: true

    });

}


/*
 * Initialize.
 */
t.render(async function () {


    const table =
        await loadTable();


    render(table);


    const openButton =
        document.getElementById(
            'openTable'
        );


    if (!openButton) {

        console.error(
            'ERROR: #openTable was not found.'
        );

        return;

    }


    openButton.addEventListener(
        'click',
        openTable
    );

});
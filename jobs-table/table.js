const t = window.TrelloPowerUp.iframe();

const STORAGE_KEY = 'itemsTable';

let table = [];


/*
 * Generate a unique ID.
 */
function generateId() {

    return 'row-' +
        Date.now().toString(36) +
        '-' +
        Math.random()
            .toString(36)
            .substring(2, 8);

}


/*
 * Load table from Trello.
 */
async function loadTable() {

    try {

        const savedTable = await t.get(
            'card',
            'shared',
            STORAGE_KEY
        );


        if (Array.isArray(savedTable)) {

            table = savedTable;

        } else {

            table = [];

        }


        render();

    } catch (error) {

        console.error(
            'Could not load table:',
            error
        );


        const status =
            document.getElementById('status');


        if (status) {

            status.textContent =
                'Error loading data';

        }

    }

}


/*
 * Save table to Trello.
 */
async function saveTable() {

    const status =
        document.getElementById('status');


    if (status) {

        status.textContent =
            'Saving...';

    }


    try {

        await t.set(
            'card',
            'shared',
            STORAGE_KEY,
            table
        );


        if (status) {

            status.textContent =
                'Saved';

        }

    } catch (error) {

        console.error(
            'Could not save table:',
            error
        );


        if (status) {

            status.textContent =
                'Error saving';

        }

    }

}


/*
 * Render table.
 */
function render() {

    const body =
        document.getElementById('tableBody');


    if (!body) {

        console.error(
            'ERROR: #tableBody was not found.'
        );

        return;

    }


    body.innerHTML = '';


    /*
     * Empty state.
     */
    if (table.length === 0) {

        body.innerHTML = `

            <tr>

                <td
                    colspan="6"
                    class="empty">

                    No items yet.
                    Click "+ Add Row".

                </td>

            </tr>

        `;


        updateTotal();

        return;

    }


    /*
     * Create rows.
     */
    table.forEach(function (row) {


        const tr =
            document.createElement('tr');


        /*
         * CHECKBOX
         */
        const checkTd =
            document.createElement('td');

        checkTd.className = 'check';


        const checkbox =
            document.createElement('input');

        checkbox.type = 'checkbox';

        checkbox.checked =
            Boolean(row.finished);


        checkbox.addEventListener(
            'change',
            async function () {

                row.finished =
                    checkbox.checked;

                await saveTable();

            }
        );


        checkTd.appendChild(checkbox);

        tr.appendChild(checkTd);


        /*
         * QUANTITY
         */
        const quantityTd =
            document.createElement('td');

        quantityTd.className =
            'quantity';


        const quantityInput =
            document.createElement('input');

        quantityInput.type = 'number';

        quantityInput.min = '0';

        quantityInput.step = '1';

        quantityInput.value =
            row.quantity ?? '';


        quantityInput.addEventListener(
            'change',
            async function () {

                row.quantity =
                    Number(
                        quantityInput.value
                    ) || 0;


                updateTotal();

                await saveTable();

            }
        );


        quantityTd.appendChild(
            quantityInput
        );

        tr.appendChild(quantityTd);


        /*
         * DESCRIPTION
         */
        const descriptionTd =
            document.createElement('td');

        descriptionTd.className =
            'description';


        const descriptionInput =
            document.createElement('input');

        descriptionInput.type = 'text';

        descriptionInput.placeholder =
            'Description';

        descriptionInput.value =
            row.description || '';


        descriptionInput.addEventListener(
            'change',
            async function () {

                row.description =
                    descriptionInput.value;

                await saveTable();

            }
        );


        descriptionTd.appendChild(
            descriptionInput
        );

        tr.appendChild(descriptionTd);


        /*
         * COST
         */
        const costTd =
            document.createElement('td');

        costTd.className =
            'cost';


        const costInput =
            document.createElement('input');

        costInput.type = 'number';

        costInput.min = '0';

        costInput.step = '0.01';

        costInput.value =
            row.cost ?? '';


        costInput.addEventListener(
            'change',
            async function () {

                row.cost =
                    Number(
                        costInput.value
                    ) || 0;


                updateTotal();

                await saveTable();

            }
        );


        costTd.appendChild(
            costInput
        );

        tr.appendChild(costTd);


        /*
         * FILE NAME
         */
        const fileTd =
            document.createElement('td');

        fileTd.className =
            'file';


        const fileInput =
            document.createElement('input');

        fileInput.type = 'text';

        fileInput.placeholder =
            'File name';

        fileInput.value =
            row.fileName || '';


        fileInput.addEventListener(
            'change',
            async function () {

                row.fileName =
                    fileInput.value;

                await saveTable();

            }
        );


        fileTd.appendChild(
            fileInput
        );

        tr.appendChild(fileTd);


        /*
         * DELETE
         */
        const deleteTd =
            document.createElement('td');

        deleteTd.className =
            'delete';


        const deleteButton =
            document.createElement('button');

        deleteButton.className =
            'delete-button';

        deleteButton.textContent =
            '×';

        deleteButton.title =
            'Delete row';


        deleteButton.addEventListener(
            'click',
            async function () {

                table = table.filter(
                    function (item) {

                        return item.id !== row.id;

                    }
                );


                render();

                await saveTable();

            }
        );


        deleteTd.appendChild(
            deleteButton
        );

        tr.appendChild(deleteTd);


        body.appendChild(tr);

    });


    updateTotal();

}


/*
 * Add a row.
 */
async function addRow() {

    table.push({

        id: generateId(),

        quantity: 1,

        description: '',

        cost: 0,

        fileName: '',

        finished: false

    });


    render();

    await saveTable();

}


/*
 * Calculate total.
 *
 * Cost = unit cost.
 *
 * Total = Quantity × Cost.
 */
function updateTotal() {

    let total = 0;


    table.forEach(function (row) {

        const quantity =
            Number(row.quantity) || 0;

        const cost =
            Number(row.cost) || 0;


        total +=
            quantity * cost;

    });


    const totalElement =
        document.getElementById('total');


    if (totalElement) {

        totalElement.textContent =
            'Total: $' +
            total.toFixed(2);

    }

}


/*
 * Initialize.
 */
t.render(async function () {


    const addRowButton =
        document.getElementById('addRow');


    if (!addRowButton) {

        console.error(
            'ERROR: #addRow was not found.'
        );

        return;

    }


    addRowButton.addEventListener(
        'click',
        addRow
    );


    await loadTable();

});
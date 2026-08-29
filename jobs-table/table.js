const t = window.TrelloPowerUp.iframe();

const STORAGE_KEY = 'itemsTable';

let table = [];


/*
 * Generate a unique ID for every row.
 */
function generateId() {
    return 'row-' +
        Date.now().toString(36) +
        '-' +
        Math.random().toString(36).substring(2, 8);
}


/*
 * Load the table from Trello.
 */
async function loadTable() {

    try {

        table = await t.get(
            'card',
            'shared',
            STORAGE_KEY,
            []
        );

        if (!Array.isArray(table)) {
            table = [];
        }

        render();

    } catch (error) {

        console.error('Could not load table:', error);

        document.getElementById('status').textContent =
            'Error loading data';
    }
}


/*
 * Save the table to Trello.
 */
async function saveTable() {

    const status = document.getElementById('status');

    status.textContent = 'Saving...';

    try {

        await t.set(
            'card',
            'shared',
            STORAGE_KEY,
            table
        );

        status.textContent = 'Saved';

    } catch (error) {

        console.error('Could not save table:', error);

        status.textContent = 'Error saving';
    }
}


/*
 * Render the entire table.
 */
function render() {

    const body = document.getElementById('tableBody');

    body.innerHTML = '';


    if (table.length === 0) {

        body.innerHTML = `
          <tr>
            <td colspan="6" class="empty">
              No items yet. Click "+ Add Row".
            </td>
          </tr>
        `;

        updateTotal();

        return;
    }


    table.forEach(function (row) {

        const tr = document.createElement('tr');

        /*
         * Checkbox
         */
        const checkTd = document.createElement('td');

        checkTd.className = 'check';

        const checkbox = document.createElement('input');

        checkbox.type = 'checkbox';
        checkbox.checked = !!row.finished;

        checkbox.addEventListener('change', async function () {

            row.finished = checkbox.checked;

            await saveTable();

        });

        checkTd.appendChild(checkbox);

        tr.appendChild(checkTd);


        /*
         * Quantity
         */
        const quantityTd = document.createElement('td');

        quantityTd.className = 'quantity';

        const quantityInput = document.createElement('input');

        quantityInput.type = 'number';
        quantityInput.min = '0';
        quantityInput.step = '1';
        quantityInput.value = row.quantity ?? '';

        quantityInput.addEventListener('change', async function () {

            row.quantity = Number(quantityInput.value) || 0;

            updateTotal();

            await saveTable();

        });

        quantityTd.appendChild(quantityInput);

        tr.appendChild(quantityTd);


        /*
         * Description
         */
        const descriptionTd = document.createElement('td');

        const descriptionInput = document.createElement('input');

        descriptionInput.type = 'text';
        descriptionInput.placeholder = 'Description';
        descriptionInput.value = row.description || '';

        descriptionInput.addEventListener('change', async function () {

            row.description = descriptionInput.value;

            await saveTable();

        });

        descriptionTd.appendChild(descriptionInput);

        tr.appendChild(descriptionTd);


        /*
         * Cost
         */
        const costTd = document.createElement('td');

        costTd.className = 'cost';

        const costInput = document.createElement('input');

        costInput.type = 'number';
        costInput.min = '0';
        costInput.step = '0.01';
        costInput.value = row.cost ?? '';

        costInput.addEventListener('change', async function () {

            row.cost = Number(costInput.value) || 0;

            updateTotal();

            await saveTable();

        });

        costTd.appendChild(costInput);

        tr.appendChild(costTd);


        /*
         * File Name
         */
        const fileTd = document.createElement('td');

        fileTd.className = 'file';

        const fileInput = document.createElement('input');

        fileInput.type = 'text';
        fileInput.placeholder = 'File name';
        fileInput.value = row.fileName || '';

        fileInput.addEventListener('change', async function () {

            row.fileName = fileInput.value;

            await saveTable();

        });

        fileTd.appendChild(fileInput);

        tr.appendChild(fileTd);


        /*
         * Delete
         */
        const deleteTd = document.createElement('td');

        const deleteButton = document.createElement('button');

        deleteButton.className = 'delete-button';

        deleteButton.textContent = '×';

        deleteButton.title = 'Delete row';

        deleteButton.addEventListener('click', async function () {

            table = table.filter(function (item) {

                return item.id !== row.id;

            });

            render();

            await saveTable();

        });

        deleteTd.appendChild(deleteButton);

        tr.appendChild(deleteTd);


        body.appendChild(tr);

    });


    updateTotal();
}


/*
 * Add a new row.
 */
document
    .getElementById('addRow')
    .addEventListener('click', async function () {

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

    });


/*
 * Calculate total.
 *
 * Cost is treated as UNIT cost.
 *
 * Quantity × Cost
 */
function updateTotal() {

    let total = 0;

    table.forEach(function (row) {

        const quantity = Number(row.quantity) || 0;

        const cost = Number(row.cost) || 0;

        total += quantity * cost;

    });


    document.getElementById('total').textContent =
        'Total: $' + total.toFixed(2);
}


/*
 * Start.
 */
t.render(function () {

    return loadTable();

});
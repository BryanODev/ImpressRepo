const t = window.TrelloPowerUp.iframe();

const STORAGE_KEY = 'itemsTable';


/*
 * Load table data.
 */
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
 * Render preview.
 */
function render(table) {

    const itemsElement =
        document.getElementById('items');

    const progressElement =
        document.getElementById('progress');


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

        item.className = 'item';


        /*
         * Checkbox.
         */
        const checkbox =
            document.createElement('input');

        checkbox.type = 'checkbox';

        checkbox.className = 'checkbox';

        checkbox.checked =
            Boolean(row.finished);

        checkbox.disabled = true;


        /*
         * Description.
         */
        const description =
            document.createElement('span');

        description.className = 'description';

        if (row.finished) {

            description.classList.add('finished');

        }


        description.textContent =
            row.description ||
            'Untitled item';


        item.appendChild(checkbox);

        item.appendChild(description);

        itemsElement.appendChild(item);

    });

}


/*
 * Open the full table.
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
        document.getElementById('openTable');


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
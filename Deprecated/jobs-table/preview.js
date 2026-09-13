const t = window.TrelloPowerUp.iframe();

const STORAGE_KEY = 'itemsTable';
const FOLDER_KEY = 'folderName';

/*
 * Load table data.
 */
async function loadTable() {
    try {
        const savedTable = await t.get('card', 'shared', STORAGE_KEY);
        if (Array.isArray(savedTable)) {
            return savedTable;
        }
        return [];
    } catch (error) {
        console.error('Could not load table:', error);
        return [];
    }
}

/*
 * Load folder name.
 */
async function loadFolderName() {
    try {
        const savedName = await t.get('card', 'shared', FOLDER_KEY);
        return savedName || '';
    } catch (error) {
        console.error('Could not load folder name:', error);
        return '';
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
        const quantity = Number(row.quantity) || 0;
        const cost = Number(row.cost) || 0;
        price += quantity * cost;
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
    const itemsElement = document.getElementById('items');
    const progressElement = document.getElementById('progress');
    const priceElement = document.getElementById('price');

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

        progressElement.textContent = '0 / 0 finished';
        priceElement.textContent = '$0.00';
        return;
    }

    /*
     * Finished count.
     */
    const finishedCount = table.filter(function (row) {
        return row.finished === true;
    }).length;

    progressElement.textContent = finishedCount + ' / ' + table.length + ' finished';

    /*
     * Render items.
     */
    table.forEach(function (row) {
        const item = document.createElement('div');
        item.className = 'item';

        /*
         * Checkbox.
         */
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'checkbox';
        checkbox.checked = Boolean(row.finished);
        checkbox.disabled = true;

        /*
         * Description.
         *
         * Use product name if available.
         * Fall back to old description data.
         */
        const description = document.createElement('span');
        description.className = 'description';

        if (row.finished) {
            description.classList.add('finished');
        }

        description.textContent = row.productName || row.description || 'Untitled item';

        item.appendChild(checkbox);
        item.appendChild(description);
        itemsElement.appendChild(item);
    });

    /*
     * Price.
     */
    const price = calculatePrice(table);
    priceElement.textContent = formatCurrency(price);
}

/*
 * Open full table.
 */
async function openTable() {
    await t.modal({
        title: 'Task Table',
        url: './table.html',
        fullscreen: true,
        resizable: true
    });
}

/*
 * Initialize and setup event listeners.
 */
let isInitialized = false;

t.render(async function () {
    const table = await loadTable();
    const folderName = await loadFolderName();

    const folderInput = document.getElementById('folderName');
    
    // Set folder input value if user isn't actively typing in it
    if (folderInput && document.activeElement !== folderInput) {
        folderInput.value = folderName;
    }

    render(table);

    // Ensure event listeners are attached only once
    if (!isInitialized) {
        const openButton = document.getElementById('openTable');

        if (!openButton) {
            console.error('ERROR: #openTable was not found.');
        } else {
            openButton.addEventListener('click', openTable);
        }

        if (folderInput) {
            folderInput.addEventListener('change', async function (e) {
                await t.set('card', 'shared', FOLDER_KEY, e.target.value.trim());
            });

            folderInput.addEventListener('input', async function (e) {
                await t.set('card', 'shared', FOLDER_KEY, e.target.value.trim());
            });
        }

        isInitialized = true;
    }
});
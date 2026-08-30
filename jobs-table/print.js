const t = window.TrelloPowerUp.iframe();

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

const IVU_RATE = 0.115;
const STORAGE_KEY = 'itemsTable';

/*
 * ========================================
 * PRODUCT CATALOG
 * ========================================
 */

async function loadCatalog() {
    try {
        const response = await fetch('./products.json', { cache: 'no-cache' });
        if (!response.ok) {
            throw new Error('Could not load products.json');
        }
        const catalog = await response.json();
        if (!catalog || !Array.isArray(catalog.products)) {
            throw new Error('Invalid products.json format');
        }
        return catalog;
    } catch (error) {
        console.error('Could not load product catalog:', error);
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
        const table = await t.get('card', 'shared', STORAGE_KEY);
        if (Array.isArray(table)) {
            return table;
        }
        return [];
    } catch (error) {
        console.error('Could not load table:', error);
        return [];
    }
}

async function loadCardInfo() {
    try {
        const card = await t.card('id', 'name', 'customFieldItems');
        return card || {};
    } catch (error) {
        console.error('Could not load card information:', error);
        return {};
    }
}

async function loadCustomFieldDefinitions() {
    try {
        const board = await t.board('customFields');
        if (board && Array.isArray(board.customFields)) {
            return board.customFields;
        }
        return [];
    } catch (error) {
        console.error('Could not load custom field definitions:', error);
        return [];
    }
}

function formatCurrency(value) {
    return '$' + Number(value || 0).toFixed(2);
}

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
        return value.map(displayValue).join(', ');
    }
    if (typeof value === 'object') {
        if (value.text !== undefined) {
            return displayValue(value.text);
        }
        if (value.value !== undefined) {
            return displayValue(value.value);
        }
        return '—';
    }
    return String(value);
}

function isCustomSelection(value) {
    if (value === undefined || value === null) {
        return false;
    }
    return String(value).trim().toLowerCase() === 'custom';
}

function isDependencyMet(dependsOn, row) {
    if (!dependsOn || !dependsOn.id) {
        return true;
    }
    const options = (row && row.options) || {};
    const currentValue = options[dependsOn.id];

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
    const options = (row && row.options) || {};
    const rawValue = options[optionId];
    const customText = options[optionId + '__custom'];

    if (Array.isArray(rawValue)) {
        if (rawValue.length === 0) {
            return '—';
        }
        return rawValue.map(function (item) {
            if (isCustomSelection(item)) {
                return customText ? ('Custom — ' + customText) : 'Custom';
            }
            return displayValue(item);
        }).join(', ');
    }

    if (typeof rawValue === 'boolean') {
        return rawValue ? 'Yes' : 'No';
    }

    if (isCustomSelection(rawValue)) {
        return customText ? ('Custom — ' + customText) : 'Custom';
    }

    return displayValue(rawValue);
}

function getCustomFieldValue(field, customFieldItem) {
    if (!customFieldItem) {
        return '—';
    }

    if (field.type === 'list') {
        const optionId = customFieldItem.idValue;
        if (optionId && Array.isArray(field.options)) {
            const option = field.options.find(function (item) {
                return item.id === optionId;
            });
            if (option) {
                return displayValue(option.value);
            }
        }
        if (customFieldItem.value && customFieldItem.value.text !== undefined) {
            return displayValue(customFieldItem.value.text);
        }
        return '—';
    }

    if (field.type === 'checkbox') {
        if (customFieldItem.value && customFieldItem.value.checked !== undefined) {
            return customFieldItem.value.checked ? 'Yes' : 'No';
        }
        return '—';
    }

    if (field.type === 'date') {
        const dateValue = customFieldItem.value && customFieldItem.value.date;
        if (!dateValue) {
            return '—';
        }
        const date = new Date(dateValue);
        if (Number.isNaN(date.getTime())) {
            return displayValue(dateValue);
        }
        return date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
    }

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

function findCustomField(fieldName, definitions) {
    const wanted = String(fieldName).trim().toLowerCase();
    return definitions.find(function (field) {
        return String(field.name || '').trim().toLowerCase() === wanted;
    }) || null;
}

function findCustomFieldItem(fieldId, items) {
    return items.find(function (item) {
        return item.idCustomField === fieldId;
    }) || null;
}

function createCustomFieldItem(label, value) {
    const wrapper = document.createElement('div');
    wrapper.className = 'custom-field-item';

    const labelElement = document.createElement('span');
    labelElement.className = 'label';
    labelElement.textContent = label;

    const valueElement = document.createElement('strong');
    valueElement.className = 'custom-field-value';
    valueElement.textContent = value;

    wrapper.appendChild(labelElement);
    wrapper.appendChild(valueElement);
    return wrapper;
}

function renderCustomFields(cardInfo, customFieldDefinitions) {
    const container = document.getElementById('customFields');
    if (!container) {
        return;
    }
    container.innerHTML = '';

    const items = Array.isArray(cardInfo.customFieldItems) ? cardInfo.customFieldItems : [];

    PRINT_CUSTOM_FIELDS.forEach(function (fieldName) {
        const field = findCustomField(fieldName, customFieldDefinitions);
        if (!field) {
            container.appendChild(createCustomFieldItem(fieldName, '—'));
            return;
        }

        const item = findCustomFieldItem(field.id, items);
        const value = getCustomFieldValue(field, item);
        container.appendChild(createCustomFieldItem(field.name, value));
    });
}

function calculateTotals(table) {
    let price = 0;
    table.forEach(function (row) {
        const quantity = Number(row.quantity) || 0;
        const cost = Number(row.cost) || 0;
        price += quantity * cost;
    });

    const subtotal = price;
    const ivu = subtotal * IVU_RATE;
    const total = subtotal + ivu;
    return { price, subtotal, ivu, total };
}

function createDetail(label, value) {
    const wrapper = document.createElement('div');
    wrapper.className = 'detail';

    const labelElement = document.createElement('span');
    labelElement.className = 'detail-label';
    labelElement.textContent = label;

    const valueElement = document.createElement('span');
    valueElement.className = 'detail-value';
    valueElement.textContent = value;

    wrapper.appendChild(labelElement);
    wrapper.appendChild(valueElement);
    return wrapper;
}

function createOption(label, value, deprecated) {
    const wrapper = document.createElement('div');
    wrapper.className = 'option';

    const labelElement = document.createElement('span');
    labelElement.className = 'option-label';
    labelElement.textContent = label + ':';

    const valueElement = document.createElement('span');
    valueElement.className = 'option-value';

    if (deprecated) {
        valueElement.classList.add('deprecated');
    }

    valueElement.textContent = deprecated ? (value + ' (DEPRECATED)') : value;

    wrapper.appendChild(labelElement);
    wrapper.appendChild(valueElement);
    return wrapper;
}

function formatOptionLabel(id) {
    if (!id) {
        return '';
    }
    return id.replace(/_/g, ' ').replace(/\b\w/g, function (letter) {
        return letter.toUpperCase();
    });
}

function buildOptionRows(row, product) {
    const rowOptions = (row && row.options && typeof row.options === 'object') ? row.options : {};
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

    return orderedKeys.filter(function (key) {
        const def = findOptionDefinition(key, product);
        if (def && def.dependsOn) {
            return isDependencyMet(def.dependsOn, row);
        }
        return true;
    }).map(function (key) {
        const def = findOptionDefinition(key, product);
        const label = def && def.label ? def.label : formatOptionLabel(key);
        const deprecated = product ? !def : false;
        const value = resolveRawOptionValue(key, row);
        return { label, value, deprecated };
    });
}

function createProductCard(row, catalog) {
    const card = document.createElement('section');
    card.className = 'product-card';

    const header = document.createElement('div');
    header.className = 'product-header';

    const productName = document.createElement('div');
    productName.className = 'product-name';
    productName.textContent = row.productName || row.description || 'Untitled Item';

    const status = document.createElement('div');
    status.className = 'product-status';

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

    const body = document.createElement('div');
    body.className = 'product-body';

    const grid = document.createElement('div');
    grid.className = 'product-grid';

    grid.appendChild(createDetail('Quantity', String(Number(row.quantity) || 0)));
    grid.appendChild(createDetail('Cost', formatCurrency(Number(row.cost) || 0)));

    if (row.fileName) {
        grid.appendChild(createDetail('File Name', row.fileName));
    }

    body.appendChild(grid);

    const product = getProduct(catalog, row.productId);
    const optionRows = buildOptionRows(row, product);

    if (optionRows.length > 0) {
        const optionSection = document.createElement('div');
        optionSection.className = 'option-section';

        const optionTitle = document.createElement('div');
        optionTitle.className = 'option-title';
        optionTitle.textContent = 'Product Options';

        optionSection.appendChild(optionTitle);

        const optionList = document.createElement('div');
        optionList.className = 'option-list';

        optionRows.forEach(function (option) {
            optionList.appendChild(createOption(option.label, option.value, option.deprecated));
        });

        optionSection.appendChild(optionList);
        body.appendChild(optionSection);
    }

    card.appendChild(body);
    return card;
}

function render(table, cardInfo, customFieldDefinitions, catalog) {
    const cardName = document.getElementById('cardName');
    if (cardName) {
        cardName.textContent = cardInfo.name || 'Untitled Card';
    }

    const jobId = document.getElementById('jobId');
    if (jobId) {
        jobId.textContent = cardInfo.id ? cardInfo.id.slice(-6).toUpperCase() : '—';
    }

    const dateElement = document.getElementById('date');
    if (dateElement) {
        dateElement.textContent = new Date().toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    renderCustomFields(cardInfo, customFieldDefinitions);

    const itemCount = document.getElementById('itemCount');
    if (itemCount) {
        itemCount.textContent = String(table.length);
    }

    const footerItemCount = document.getElementById('footerItemCount');
    if (footerItemCount) {
        footerItemCount.textContent = String(table.length);
    }

    const finishedCount = document.getElementById('finishedCount');
    if (finishedCount) {
        const count = table.filter(function (row) { return row.finished; }).length;
        finishedCount.textContent = String(count);
    }

    const itemsContainer = document.getElementById('items');
    if (itemsContainer) {
        itemsContainer.innerHTML = '';

        if (table.length === 0) {
            itemsContainer.innerHTML = '<div class="empty">No items registered for this job order.</div>';
        } else {
            table.forEach(function (row) {
                itemsContainer.appendChild(createProductCard(row, catalog));
            });
        }
    }

    const totals = calculateTotals(table);

    const priceElement = document.getElementById('price');
    if (priceElement) {
        priceElement.textContent = formatCurrency(totals.price);
    }

    const subtotalElement = document.getElementById('subtotal');
    if (subtotalElement) {
        subtotalElement.textContent = formatCurrency(totals.subtotal);
    }

    const ivuElement = document.getElementById('ivu');
    if (ivuElement) {
        ivuElement.textContent = formatCurrency(totals.ivu);
    }

    const totalElement = document.getElementById('total');
    if (totalElement) {
        totalElement.textContent = formatCurrency(totals.total);
    }
}

t.render(async function () {
    const printButton = document.getElementById('printButton');
    if (printButton) {
        printButton.addEventListener('click', function () {
            window.print();
        });
    }

    const backToTableBtn = document.getElementById('backToTableButton');
    if (backToTableBtn) {
        backToTableBtn.addEventListener('click', async function () {
            await t.modal({
                title: 'Task Table',
                url: './table.html',
                fullscreen: true,
                resizable: true
            });
        });
    }

    const catalog = await loadCatalog();
    const table = await loadTable();
    const cardInfo = await loadCardInfo();
    const customFieldDefinitions = await loadCustomFieldDefinitions();

    render(table, cardInfo, customFieldDefinitions, catalog);
});
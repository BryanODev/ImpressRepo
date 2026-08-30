const t =
    window.TrelloPowerUp.iframe();


const STORAGE_KEY =
    'itemsTable';


/*
 * ========================================
 * SETTINGS
 * ========================================
 */


const IVU_RATE = 0.115;


/*
 * ========================================
 * DATA
 * ========================================
 */


let table = [];

let catalog = null;


/*
 * ========================================
 * GENERATE ID
 * ========================================
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
 * ========================================
 * LOAD PRODUCT CATALOG
 * ========================================
 */


async function loadCatalog() {

    try {

        const response =
            await fetch(
                './products.json',
                {
                    cache: 'no-cache'
                }
            );


        if (!response.ok) {

            throw new Error(
                'Could not load products.json'
            );

        }


        catalog =
            await response.json();


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


    } catch (error) {

        console.error(
            'Could not load product catalog:',
            error
        );


        catalog = {

            version: 0,

            products: []

        };


        const status =
            document.getElementById(
                'status'
            );


        if (status) {

            status.textContent =
                'Error loading catalog';

        }

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
 * GET ACTIVE PRODUCTS
 * ========================================
 */


function getActiveProducts() {

    if (!catalog) {

        return [];

    }


    return catalog.products.filter(
        function (product) {

            return product.active !== false;

        }
    );

}


/*
 * ========================================
 * LOAD TABLE
 * ========================================
 */


async function loadTable() {

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


        render();


    } catch (error) {

        console.error(
            'Could not load table:',
            error
        );


        table = [];


        const status =
            document.getElementById(
                'status'
            );


        if (status) {

            status.textContent =
                'Error loading data';

        }

    }

}


/*
 * ========================================
 * SAVE TABLE
 * ========================================
 */


async function saveTable() {

    const status =
        document.getElementById(
            'status'
        );


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
 * ========================================
 * CALCULATE TOTALS
 * ========================================
 */


function calculateTotals() {

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
 * FORMAT CURRENCY
 * ========================================
 */


function formatCurrency(value) {

    return '$' +
        value.toFixed(2);

}


/*
 * ========================================
 * DEFAULT OPTION VALUE
 * ========================================
 */


function getDefaultValue(option) {

    if (
        option.default !== undefined
    ) {

        return option.default;

    }


    if (
        option.type === 'checkbox'
    ) {

        return false;

    }


    if (
        option.type === 'checkboxGroup'
    ) {

        return [];

    }


    if (
        option.type === 'radio' ||
        option.type === 'radioWithCustom'
    ) {

        return '';

    }


    if (
        option.type === 'select' ||
        option.type === 'selectWithCustom'
    ) {

        const firstOption =
            Array.isArray(option.options) &&
            option.options.length > 0
                ? option.options[0]
                : '';


        return firstOption;

    }


    return '';

}


/*
 * ========================================
 * CREATE PRODUCT SELECT
 * ========================================
 */


function createProductSelect(row) {

    const select =
        document.createElement(
            'select'
        );


    const placeholder =
        document.createElement(
            'option'
        );


    placeholder.value =
        '';


    placeholder.textContent =
        'Select product...';


    placeholder.disabled =
        true;


    if (!row.productId) {

        placeholder.selected =
            true;

    }


    select.appendChild(
        placeholder
    );


    const products =
        getActiveProducts();


    products.forEach(
        function (product) {

            const option =
                document.createElement(
                    'option'
                );


            option.value =
                product.id;


            option.textContent =
                product.name;


            if (
                row.productId ===
                product.id
            ) {

                option.selected =
                    true;

            }


            select.appendChild(
                option
            );

        }
    );


    select.addEventListener(
        'change',
        async function () {

            const product =
                getProduct(
                    select.value
                );


            if (!product) {

                return;

            }


            row.productId =
                product.id;


            row.productName =
                product.name;


            row.description =
                product.name;


            row.options =
                {};


            if (
                Array.isArray(
                    product.options
                )
            ) {

                product.options.forEach(
                    function (option) {

                        row.options[
                            option.id
                        ] =
                            getDefaultValue(
                                option
                            );

                    }
                );

            }


            render();


            await saveTable();

        }
    );


    return select;

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
 * CREATE CUSTOM INPUT
 * ========================================
 */


function createCustomInput(
    row,
    optionDefinition,
    optionId,
    isVisible,
    onSave
) {

    const input =
        document.createElement(
            'input'
        );


    input.type =
        'text';


    input.className =
        'option-custom-input';


    input.placeholder =
        optionDefinition.customPlaceholder ||
        'Specify...';


    input.value =
        row.options[
            optionId +
            '__custom'
        ] || '';


    input.style.display =
        isVisible
            ? ''
            : 'none';


    input.addEventListener(
        'input',
        async function () {

            row.options[
                optionId +
                '__custom'
            ] =
                input.value;


            if (onSave) {

                await onSave();

            } else {

                await saveTable();

            }

        }
    );


    return input;

}


/*
 * ========================================
 * SELECT / DROPDOWN
 * ========================================
 */


function createSelectControl(
    row,
    optionDefinition,
    optionId,
    value
) {

    const wrapper =
        document.createElement(
            'div'
        );


    wrapper.className =
        'option-radio-group';


    const select =
        document.createElement(
            'select'
        );


    const options =
        Array.isArray(
            optionDefinition.options
        )
            ? optionDefinition.options
            : [];


    options.forEach(
        function (possibleValue) {

            const option =
                document.createElement(
                    'option'
                );


            option.value =
                possibleValue;


            option.textContent =
                possibleValue;


            if (
                value ===
                possibleValue
            ) {

                option.selected =
                    true;

            }


            select.appendChild(
                option
            );

        }
    );


    wrapper.appendChild(
        select
    );


    let customInput =
        null;


    /*
     * Custom input is only created
     * for selectWithCustom.
     */
    if (
        optionDefinition.type ===
        'selectWithCustom'
    ) {

        customInput =
            createCustomInput(
                row,
                optionDefinition,
                optionId,
                isCustomOption(
                    value
                )
            );


        wrapper.appendChild(
            customInput
        );

    }


    select.addEventListener(
        'change',
        async function () {

            row.options[
                optionId
            ] =
                select.value;


            if (customInput) {

                customInput.style.display =
                    isCustomOption(
                        select.value
                    )
                        ? ''
                        : 'none';

            }


            await saveTable();

        }
    );


    return wrapper;

}


/*
 * ========================================
 * CREATE OPTION CONTROL
 * ========================================
 */


function createOptionControl(
    row,
    optionDefinition
) {

    const optionId =
        optionDefinition.id;


    if (
        !row.options ||
        typeof row.options !== 'object'
    ) {

        row.options = {};

    }


    let value =
        row.options[optionId];


    /*
     * ========================================
     * SELECT
     * ========================================
     */


    if (
        optionDefinition.type ===
        'select' ||
        optionDefinition.type ===
        'selectWithCustom'
    ) {

        return createSelectControl(
            row,
            optionDefinition,
            optionId,
            value
        );

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

        const wrapper =
            document.createElement(
                'div'
            );


        wrapper.className =
            'option-radio-group';


        const options =
            Array.isArray(
                optionDefinition.options
            )
                ? optionDefinition.options
                : [];


        const radioName =
            'radio-' +
            row.id +
            '-' +
            optionId;


        options.forEach(
            function (
                possibleValue
            ) {

                const item =
                    document.createElement(
                        'label'
                    );


                item.className =
                    'option-radio-item';


                const radio =
                    document.createElement(
                        'input'
                    );


                radio.type =
                    'radio';


                radio.name =
                    radioName;


                radio.value =
                    possibleValue;


                radio.checked =
                    value ===
                    possibleValue;


                const text =
                    document.createElement(
                        'span'
                    );


                text.textContent =
                    possibleValue;


                item.appendChild(
                    radio
                );


                item.appendChild(
                    text
                );


                radio.addEventListener(
                    'change',
                    async function () {

                        if (
                            !radio.checked
                        ) {

                            return;

                        }


                        row.options[
                            optionId
                        ] =
                            radio.value;


                        await saveTable();

                    }
                );


                wrapper.appendChild(
                    item
                );

            }
        );


        return wrapper;

    }


    /*
     * ========================================
     * RADIO + CUSTOM
     * ========================================
     */


    if (
        optionDefinition.type ===
        'radioWithCustom'
    ) {

        const wrapper =
            document.createElement(
                'div'
            );


        wrapper.className =
            'option-radio-group';


        const options =
            Array.isArray(
                optionDefinition.options
            )
                ? optionDefinition.options
                : [];


        const radioName =
            'radio-' +
            row.id +
            '-' +
            optionId;


        options.forEach(
            function (
                possibleValue
            ) {

                const item =
                    document.createElement(
                        'label'
                    );


                item.className =
                    'option-radio-item';


                const radio =
                    document.createElement(
                        'input'
                    );


                radio.type =
                    'radio';


                radio.name =
                    radioName;


                radio.value =
                    possibleValue;


                radio.checked =
                    value ===
                    possibleValue;


                const text =
                    document.createElement(
                        'span'
                    );


                text.textContent =
                    possibleValue;


                item.appendChild(
                    radio
                );


                item.appendChild(
                    text
                );


                let customInput =
                    null;


                if (
                    isCustomOption(
                        possibleValue
                    )
                ) {

                    customInput =
                        createCustomInput(
                            row,
                            optionDefinition,
                            optionId,
                            radio.checked
                        );


                    item.appendChild(
                        customInput
                    );

                }


                radio.addEventListener(
                    'change',
                    async function () {

                        if (
                            !radio.checked
                        ) {

                            return;

                        }


                        row.options[
                            optionId
                        ] =
                            radio.value;


                        if (customInput) {

                            customInput.style.display =
                                '';

                        }


                        const allCustomInputs =
                            wrapper.querySelectorAll(
                                '.option-custom-input'
                            );


                        allCustomInputs.forEach(
                            function (input) {

                                if (
                                    input !==
                                    customInput
                                ) {

                                    input.style.display =
                                        'none';

                                }

                            }
                        );


                        await saveTable();

                    }
                );


                wrapper.appendChild(
                    item
                );

            }
        );


        return wrapper;

    }


    /*
     * ========================================
     * CHECKBOX GROUP
     * ========================================
     */


    if (
        optionDefinition.type ===
        'checkboxGroup'
    ) {

        const wrapper =
            document.createElement(
                'div'
            );


        wrapper.className =
            'option-checkbox-group';


        const options =
            Array.isArray(
                optionDefinition.options
            )
                ? optionDefinition.options
                : [];


        if (
            !Array.isArray(value)
        ) {

            value = [];


            row.options[
                optionId
            ] =
                value;

        }


        options.forEach(
            function (
                possibleValue
            ) {

                const item =
                    document.createElement(
                        'label'
                    );


                item.className =
                    'option-checkbox-item';


                const checkbox =
                    document.createElement(
                        'input'
                    );


                checkbox.type =
                    'checkbox';


                checkbox.value =
                    possibleValue;


                checkbox.checked =
                    value.includes(
                        possibleValue
                    );


                const text =
                    document.createElement(
                        'span'
                    );


                text.textContent =
                    possibleValue;


                item.appendChild(
                    checkbox
                );


                item.appendChild(
                    text
                );


                let customInput =
                    null;


                if (
                    isCustomOption(
                        possibleValue
                    )
                ) {

                    customInput =
                        createCustomInput(
                            row,
                            optionDefinition,
                            optionId,
                            checkbox.checked
                        );


                    item.appendChild(
                        customInput
                    );

                }


                checkbox.addEventListener(
                    'change',
                    async function () {

                        let selected =
                            Array.isArray(
                                row.options[
                                    optionId
                                ]
                            )
                                ? row.options[
                                    optionId
                                ]
                                : [];


                        if (
                            checkbox.checked
                        ) {

                            if (
                                !selected.includes(
                                    possibleValue
                                )
                            ) {

                                selected.push(
                                    possibleValue
                                );

                            }

                        } else {

                            selected =
                                selected.filter(
                                    function (
                                        selectedValue
                                    ) {

                                        return (
                                            selectedValue !==
                                            possibleValue
                                        );

                                    }
                                );

                        }


                        row.options[
                            optionId
                        ] =
                            selected;


                        if (customInput) {

                            customInput.style.display =
                                checkbox.checked
                                    ? ''
                                    : 'none';

                        }


                        await saveTable();

                    }
                );


                wrapper.appendChild(
                    item
                );

            }
        );


        return wrapper;

    }


    /*
     * ========================================
     * SINGLE CHECKBOX
     * ========================================
     */


    if (
        optionDefinition.type ===
        'checkbox'
    ) {

        const wrapper =
            document.createElement(
                'label'
            );


        wrapper.className =
            'option-checkbox';


        const checkbox =
            document.createElement(
                'input'
            );


        checkbox.type =
            'checkbox';


        checkbox.checked =
            Boolean(value);


        const text =
            document.createElement(
                'span'
            );


        text.textContent =
            'Yes';


        checkbox.addEventListener(
            'change',
            async function () {

                row.options[
                    optionId
                ] =
                    checkbox.checked;


                await saveTable();

            }
        );


        wrapper.appendChild(
            checkbox
        );


        wrapper.appendChild(
            text
        );


        return wrapper;

    }


    /*
     * ========================================
     * NUMBER
     * ========================================
     */


    if (
        optionDefinition.type ===
        'number'
    ) {

        const input =
            document.createElement(
                'input'
            );


        input.type =
            'number';


        input.value =
            value ?? '';


        if (
            optionDefinition.min !==
            undefined
        ) {

            input.min =
                optionDefinition.min;

        }


        if (
            optionDefinition.max !==
            undefined
        ) {

            input.max =
                optionDefinition.max;

        }


        if (
            optionDefinition.step !==
            undefined
        ) {

            input.step =
                optionDefinition.step;

        }


        input.addEventListener(
            'change',
            async function () {

                row.options[
                    optionId
                ] =
                    input.value;


                await saveTable();

            }
        );


        return input;

    }


    /*
     * ========================================
     * TEXT
     * ========================================
     */


    const input =
        document.createElement(
            'input'
        );


    input.type =
        'text';


    input.value =
        value ?? '';


    if (
        optionDefinition.placeholder
    ) {

        input.placeholder =
            optionDefinition.placeholder;

    }


    input.addEventListener(
        'change',
        async function () {

            row.options[
                optionId
            ] =
                input.value;


            await saveTable();

        }
    );


    return input;

}


/*
 * ========================================
 * CREATE OPTIONS AREA
 * ========================================
 */


function createOptionsArea(row) {

    const container =
        document.createElement(
            'div'
        );


    container.className =
        'options-container';


    const product =
        getProduct(
            row.productId
        );


    if (!product) {

        return container;

    }


    if (
        Array.isArray(
            product.options
        )
    ) {

        product.options.forEach(
            function (optionDefinition) {

                const wrapper =
                    document.createElement(
                        'div'
                    );


                wrapper.className =
                    'option-row';


                const label =
                    document.createElement(
                        'span'
                    );


                label.className =
                    'option-label';


                label.textContent =
                    optionDefinition.label;


                const control =
                    document.createElement(
                        'div'
                    );


                control.className =
                    'option-control';


                control.appendChild(
                    createOptionControl(
                        row,
                        optionDefinition
                    )
                );


                wrapper.appendChild(
                    label
                );


                wrapper.appendChild(
                    control
                );


                container.appendChild(
                    wrapper
                );

            }
        );

    }


    return container;

}


/*
 * ========================================
 * FORMAT OPTION VALUE
 * ========================================
 */


function formatOptionValue(
    value,
    customValue
) {

    if (
        typeof value === 'boolean'
    ) {

        return value
            ? 'Yes'
            : 'No';

    }


    if (
        Array.isArray(value)
    ) {

        if (
            value.length === 0
        ) {

            return '—';

        }


        return value.map(
            function (selectedValue) {

                if (
                    isCustomOption(
                        selectedValue
                    ) &&
                    customValue
                ) {

                    return (
                        'Custom — ' +
                        customValue
                    );

                }


                return selectedValue;

            }
        ).join(', ');

    }


    if (
        isCustomOption(value) &&
        customValue
    ) {

        return (
            'Custom — ' +
            customValue
        );

    }


    if (
        value === '' ||
        value === null ||
        value === undefined
    ) {

        return '—';

    }


    return String(value);

}


/*
 * ========================================
 * RENDER
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


    if (table.length === 0) {

        body.innerHTML = `

            <tr>

                <td
                    colspan="7"
                    class="empty">

                    No items yet.
                    Click "+ Add Row".

                </td>

            </tr>

        `;


        updateTotals();

        return;

    }


    table.forEach(
        function (row) {

            const tr =
                document.createElement(
                    'tr'
                );


            /*
             * CHECK
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
                Boolean(row.finished);


            checkbox.addEventListener(
                'change',
                async function () {

                    row.finished =
                        checkbox.checked;


                    await saveTable();

                }
            );


            checkTd.appendChild(
                checkbox
            );


            tr.appendChild(
                checkTd
            );


            /*
             * QUANTITY
             */


            const quantityTd =
                document.createElement(
                    'td'
                );


            quantityTd.className =
                'quantity';


            const quantityInput =
                document.createElement(
                    'input'
                );


            quantityInput.type =
                'number';


            quantityInput.min =
                '0';


            quantityInput.step =
                '1';


            quantityInput.value =
                row.quantity ?? '';


            quantityInput.addEventListener(
                'change',
                async function () {

                    row.quantity =
                        Number(
                            quantityInput.value
                        ) || 0;


                    updateTotals();


                    await saveTable();

                }
            );


            quantityTd.appendChild(
                quantityInput
            );


            tr.appendChild(
                quantityTd
            );


            /*
             * PRODUCT
             */


            const productTd =
                document.createElement(
                    'td'
                );


            productTd.className =
                'product';


            const productSelect =
                createProductSelect(
                    row
                );


            productTd.appendChild(
                productSelect
            );


            tr.appendChild(
                productTd
            );


            /*
             * OPTIONS
             */


            const optionsTd =
                document.createElement(
                    'td'
                );


            optionsTd.className =
                'options';


            optionsTd.appendChild(
                createOptionsArea(
                    row
                )
            );


            tr.appendChild(
                optionsTd
            );


            /*
             * COST
             */


            const costTd =
                document.createElement(
                    'td'
                );


            costTd.className =
                'cost';


            const costInput =
                document.createElement(
                    'input'
                );


            costInput.type =
                'number';


            costInput.min =
                '0';


            costInput.step =
                '0.01';


            costInput.value =
                row.cost ?? '';


            costInput.addEventListener(
                'change',
                async function () {

                    row.cost =
                        Number(
                            costInput.value
                        ) || 0;


                    updateTotals();


                    await saveTable();

                }
            );


            costTd.appendChild(
                costInput
            );


            tr.appendChild(
                costTd
            );


            /*
             * FILE
             */


            const fileTd =
                document.createElement(
                    'td'
                );


            fileTd.className =
                'file';


            const fileInput =
                document.createElement(
                    'input'
                );


            fileInput.type =
                'text';


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


            tr.appendChild(
                fileTd
            );


            /*
             * DELETE
             */


            const deleteTd =
                document.createElement(
                    'td'
                );


            deleteTd.className =
                'delete';


            const deleteButton =
                document.createElement(
                    'button'
                );


            deleteButton.className =
                'delete-button';


            deleteButton.textContent =
                '×';


            deleteButton.title =
                'Delete row';


            deleteButton.addEventListener(
                'click',
                async function () {

                    table =
                        table.filter(
                            function (item) {

                                return (
                                    item.id !==
                                    row.id
                                );

                            }
                        );


                    render();


                    await saveTable();

                }
            );


            deleteTd.appendChild(
                deleteButton
            );


            tr.appendChild(
                deleteTd
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
 * UPDATE TOTALS
 * ========================================
 */


function updateTotals() {

    const totals =
        calculateTotals();


    const priceElement =
        document.getElementById(
            'price'
        );


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


    if (priceElement) {

        priceElement.textContent =
            formatCurrency(
                totals.price
            );

    }


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


    const footerStatus =
        document.getElementById(
            'footerStatus'
        );


    if (footerStatus) {

        footerStatus.textContent =
            'IVU: ' +
            (
                IVU_RATE * 100
            ).toFixed(2) +
            '%';

    }

}


/*
 * ========================================
 * ADD ROW
 * ========================================
 */


async function addRow() {

    const activeProducts =
        getActiveProducts();


    const firstProduct =
        activeProducts.length > 0
            ? activeProducts[0]
            : null;


    const row = {

        id:
            generateId(),

        quantity:
            1,

        productId:
            firstProduct
                ? firstProduct.id
                : '',

        productName:
            firstProduct
                ? firstProduct.name
                : '',

        description:
            firstProduct
                ? firstProduct.name
                : '',

        options:
            {},

        cost:
            0,

        fileName:
            '',

        finished:
            false

    };


    if (
        firstProduct &&
        Array.isArray(
            firstProduct.options
        )
    ) {

        firstProduct.options.forEach(
            function (option) {

                row.options[
                    option.id
                ] =
                    getDefaultValue(
                        option
                    );

            }
        );

    }


    table.push(row);


    render();


    await saveTable();

}


/*
 * ========================================
 * OPEN PRINT WINDOW
 * ========================================
 */


async function openPrintWindow() {

    const button =
        document.getElementById(
            'printJob'
        );


    if (button) {

        button.disabled =
            true;

        button.textContent =
            'Opening...';

    }


    try {

        await t.modal({

            title:
                'Print Job',

            url:
                './print.html',

            fullscreen:
                true,

            resizable:
                true

        });

    } catch (error) {

        console.error(
            'Could not open print window:',
            error
        );

    } finally {

        if (button) {

            button.disabled =
                false;

            button.textContent =
                '🖨️ Print Job';

        }

    }

}


/*
 * ========================================
 * INITIALIZE
 * ========================================
 */


t.render(async function () {

    const addRowButton =
        document.getElementById(
            'addRow'
        );


    if (addRowButton) {

        addRowButton.addEventListener(
            'click',
            addRow
        );

    }


    const printButton =
        document.getElementById(
            'printJob'
        );


    if (printButton) {

        printButton.addEventListener(
            'click',
            openPrintWindow
        );

    }


    await loadCatalog();


    await loadTable();

});
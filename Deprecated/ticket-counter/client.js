var WHITE_ICON = 'https://cdn.jsdelivr.net/npm/@mdi/v7.2.96/svg/plus-box-outline.svg';

var BLACK_ICON = 'https://cdn.jsdelivr.net/npm/@mdi/v7.2.96/svg/plus-box-outline.svg';

var TARGET_LIST_NAME = 'Inbox Solicitudes Nuevas';

var TEMPLATE_CARD_ID = '6a8cd9ecc1d994336094ee4b';

var API_KEY = 'eb1974fbb9e6a0def3d070da33e9cf05';



function createTicket(t) {

return (async function () {

try {

let restApi = await t.getRestApi();

let token = await restApi.getToken();



if (!token) {

return t.popup({

title: 'Authorize to continue',

url: 'authorize.html',

height: 140

});

}



let currentCount = await t.get(

'board',

'shared',

'ticketCounter',

1

);



if (

currentCount === null ||

currentCount === undefined ||

isNaN(currentCount)

) {

currentCount = 1;

}



currentCount = Number(currentCount);



let formattedId = String(currentCount).padStart(4, '0');

let cardTitle = `#${formattedId} - Impress-Task`;



let lists = await t.lists('id', 'name');



let targetList = lists.find(function (list) {

return list.name === TARGET_LIST_NAME;

});



if (!targetList) {

return t.alert({

message: `List "${TARGET_LIST_NAME}" not found on this board!`,

duration: 'error'

});

}



let response = await fetch(

`https://api.trello.com/1/cards?key=${API_KEY}&token=${token}`,

{

method: 'POST',

headers: {

'Content-Type': 'application/json'

},

body: JSON.stringify({

name: cardTitle,

idList: targetList.id,

pos: 'top',

idCardSource: TEMPLATE_CARD_ID

})

}

);



if (!response.ok) {

let errorText = await response.text();

throw new Error(

`Trello API error ${response.status}: ${errorText}`

);

}



await t.set(

'board',

'shared',

'ticketCounter',

currentCount + 1

);



t.alert({

message: `Created ticket #${formattedId}!`,

duration: 'success'

});



} catch (error) {

console.error('Ticket creation failed:', error);



t.alert({

message: 'Failed to create ticket card.',

duration: 'error'

});

}

})();

}



function authorizeUser(t) {

return t.popup({

title: 'Authorize to continue',

url: 'authorize.html',

height: 140

});

}



window.TrelloPowerUp.initialize({



'board-buttons': function (t, opts) {

return [{

icon: {

dark: WHITE_ICON,

light: BLACK_ICON

},

text: 'Create Ticket',

condition: 'edit',

callback: async function (t) {

let restApi = await t.getRestApi();

let isAuthorized = await restApi.isAuthorized();



if (!isAuthorized) {

return authorizeUser(t);

}



return createTicket(t);

}

}];

},



'authorization-status': async function (t, opts) {

let restApi = await t.getRestApi();

let isAuthorized = await restApi.isAuthorized();



return {

authorized: isAuthorized

};

},



'show-authorization': function (t, opts) {

return authorizeUser(t);

}



}, {

appKey: API_KEY,

appName: 'Impress New Task'

});
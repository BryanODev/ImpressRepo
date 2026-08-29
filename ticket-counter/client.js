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

      // Open input form modal to capture custom details
      let formData = await t.modal({
        url: 'form.html',
        title: 'New Ticket Information',
        height: 600
      });

      if (!formData) {
        return; // User canceled the modal
      }

      let currentCount = await t.get('board', 'shared', 'ticketCounter', 1);
      currentCount = isNaN(Number(currentCount)) ? 1 : Number(currentCount);

      let formattedId = String(currentCount).padStart(4, '0');
      
      // Card Title: #0000 - [Client]
      let cardTitle = `#${formattedId} - ${formData.client}`;

      let lists = await t.lists('id', 'name');
      let targetList = lists.find(list => list.name === TARGET_LIST_NAME);

      if (!targetList) {
        return t.alert({
          message: `List "${TARGET_LIST_NAME}" not found on this board!`,
          duration: 'error'
        });
      }

      // Date Calculations
      let today = new Date();
      let fechaCreacion = today.toISOString().split('T')[0]; // Today's date YYYY-MM-DD

      let weekLater = new Date();
      weekLater.setDate(today.getDate() + 7);
      let fechaSolicitada = weekLater.toISOString().split('T')[0]; // 1 week later YYYY-MM-DD

      // 1. Create card using source template
      let response = await fetch(
        `https://api.trello.com/1/cards?key=${API_KEY}&token=${token}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: cardTitle,
            idList: targetList.id,
            pos: 'top',
            idCardSource: TEMPLATE_CARD_ID,
            due: fechaSolicitada // Set Trello's core due date to requested date
          })
        }
      );

      if (!response.ok) {
        let errorText = await response.text();
        throw new Error(`Trello API error ${response.status}: ${errorText}`);
      }

      let newCard = await response.json();

      // Note: If you want to automatically push fields into Trello Native Custom Fields, 
      // you would map them via customField items endpoint here using their customField IDs.
      // For now, we store them cleanly inside the card description or rely on manual mapping.

      // Increment ticket counter
      await t.set('board', 'shared', 'ticketCounter', currentCount + 1);

      t.alert({
        message: `Created ticket #${formattedId}!`,
        duration: 'success'
      });

      // Instantly open the card for viewing/editing
      return t.showCard(newCard.id);

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
      icon: { dark: WHITE_ICON, light: BLACK_ICON },
      text: 'Create Ticket',
      condition: 'edit',
      callback: async function (t) {
        let restApi = await t.getRestApi();
        let isAuthorized = await restApi.isAuthorized();
        if (!isAuthorized) return authorizeUser(t);
        return createTicket(t);
      }
    }];
  },
  'authorization-status': async function (t, opts) {
    let restApi = await t.getRestApi();
    return { authorized: await restApi.isAuthorized() };
  },
  'show-authorization': function (t, opts) {
    return authorizeUser(t);
  }
}, {
  appKey: API_KEY,
  appName: 'Impress New Task'
});
var WHITE_ICON = 'https://cdn.jsdelivr.net/npm/@mdi/v7.2.96/svg/plus-box-outline.svg';
var BLACK_ICON = 'https://cdn.jsdelivr.net/npm/@mdi/v7.2.96/svg/plus-box-outline.svg';
var TARGET_LIST_NAME = 'Inbox Solicitudes Nuevas';
var TEMPLATE_CARD_ID = '6a8cd9ecc1d994336094ee4b';
var API_KEY = 'eb1974fbb9e6a0def3d070da33e9cf05';

function buildDescription(formData) {
  return [
    `**Vendedor:** ${formData.vendedor || 'N/A'}`,
    `**Nombre Cliente:** ${formData.nombreCliente || 'N/A'}`,
    `**Email:** ${formData.email || 'N/A'}`,
    `**Numero Telefono:** ${formData.telefono || 'N/A'}`,
    `**Prioridad:** ${formData.prioridad || 'N/A'}`,
    `**Metodo de Entrega:** ${formData.metodoEntrega || 'N/A'}`,
    `**Arte:** ${formData.arte || 'N/A'}`
  ].join('\n');
}

async function createTicket(t, formData) {
  try {
    var restApi = await t.getRestApi();
    var token = await restApi.getToken();

    if (!token) {
      return t.popup({
        title: 'Authorize to continue',
        url: 'authorize.html',
        height: 140
      });
    }

    var currentCount = await t.get('board', 'shared', 'ticketCounter', 1);
    currentCount = isNaN(Number(currentCount)) ? 1 : Number(currentCount);

    var formattedId = String(currentCount).padStart(4, '0');
    var cardTitle = `#${formattedId} - ${formData.cardTitleInput}`;

    var lists = await t.lists('id', 'name');
    var targetList = lists.find(function(list) {
      return list.name === TARGET_LIST_NAME;
    });

    if (!targetList) {
      return t.alert({
        message: `List "${TARGET_LIST_NAME}" not found on this board!`,
        duration: 'error'
      });
    }

    var today = new Date();
    var weekLater = new Date();
    weekLater.setDate(today.getDate() + 7);
    var fechaSolicitada = weekLater.toISOString().split('T')[0];

    var response = await fetch(
      `https://api.trello.com/1/cards?key=${API_KEY}&token=${token}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: cardTitle,
          desc: buildDescription(formData),
          idList: targetList.id,
          pos: 'top',
          idCardSource: TEMPLATE_CARD_ID,
          due: fechaSolicitada
        })
      }
    );

    if (!response.ok) {
      var errorText = await response.text();
      throw new Error(`Trello API error ${response.status}: ${errorText}`);
    }

    var newCard = await response.json();

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

    return t.showCard(newCard.id);

  } catch (error) {
    console.error('Ticket creation failed:', error);
    t.alert({
      message: 'Failed to create ticket card.',
      duration: 'error'
    });
  }
}

async function openTicketForm(t) {
  try {
    // MUST be t.modal() so it opens a full dialog window and correctly returns payload data via closeModal()
    var formData = await t.modal({
      title: 'New Ticket Information',
      url: 'form.html',
      height: 600
    });

    if (!formData || typeof formData !== 'object' || !formData.cardTitleInput) {
      console.log('Ticket creation cancelled or modal closed.');
      return;
    }

    return createTicket(t, formData);

  } catch (error) {
    console.error('Form failed:', error);
    t.alert({
      message: 'Could not open ticket form.',
      duration: 'error'
    });
  }
}

function authorizeUser(t) {
  return t.popup({
    title: 'Authorize to continue',
    url: 'authorize.html',
    height: 140
  });
}

window.TrelloPowerUp.initialize({
  'board-buttons': function(t, opts) {
    return [{
      icon: {
        dark: WHITE_ICON,
        light: BLACK_ICON
      },
      text: 'Create Ticket',
      condition: 'edit',
      callback: function(t) {
        return openTicketForm(t);
      }
    }];
  },

  'authorization-status': async function(t, opts) {
    var restApi = await t.getRestApi();
    return {
      authorized: await restApi.isAuthorized()
    };
  },

  'show-authorization': function(t, opts) {
    return authorizeUser(t);
  }

}, {
  appKey: API_KEY,
  appName: 'Impress New Task'
});
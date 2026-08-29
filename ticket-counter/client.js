var WHITE_ICON = 'https://cdn.jsdelivr.net/npm/@mdi/v7.2.96/svg/plus-box-outline.svg';
var BLACK_ICON = 'https://cdn.jsdelivr.net/npm/@mdi/v7.2.96/svg/plus-box-outline.svg';
var TARGET_LIST_NAME = 'Inbox Solicitudes Nuevas';
var TEMPLATE_CARD_ID = 'bdxPq3px';

var API_KEY = 'eb1974fbb9e6a0def3d070da33e9cf05'; // public, safe to expose client-side

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
        try {
          // 1. Ensure the user is authorized; prompt them if not
          let restApi = t.getRestApi();
          let isAuthorized = await restApi.isAuthorized();

          if (!isAuthorized) {
            await restApi.authorize({ scope: 'read,write', expiration: 'never' });
          }

          let token = await restApi.getToken();

          // 2. Get the current counter from Trello board storage (defaults to 1)
          let currentCount = await t.get('board', 'shared', 'ticketCounter', 1);

          // 3. Format the card name template with the ticket number
          let formattedId = String(currentCount).padStart(4, '0');
          let cardTitle = `#${formattedId} - Impress-Task`;

          // 4. Find the target list by name
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

          // 5. Create the new card by copying the template card and overriding the name
          let response = await fetch(
            `https://api.trello.com/1/cards?key=${API_KEY}&token=${token}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
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
            throw new Error(`Trello API error ${response.status}: ${errorText}`);
          }

          // 6. Increment the counter and save it back to Trello's board storage
          await t.set('board', 'shared', 'ticketCounter', currentCount + 1);

          // 7. Success notification
          t.alert({
            message: `Created ticket #${formattedId}!`,
            duration: 'success'
          });

        } catch (error) {
          console.error(error);
          t.alert({
            message: 'Failed to create ticket card.',
            duration: 'error'
          });
        }
      }
    }];
  },

  // Optional but recommended: lets Trello show an "Authorize account" prompt
  // elsewhere in the UI (e.g. Power-Up settings) if you want that surfaced.
  'authorization-status': function (t, opts) {
    return t.getRestApi().isAuthorized().then(function (isAuthorized) {
      return { authorized: isAuthorized };
    });
  },

  'show-authorization': function (t, opts) {
    return t.getRestApi().authorize({ scope: 'read,write', expiration: 'never' });
  }
});
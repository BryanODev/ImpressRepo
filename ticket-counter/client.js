var WHITE_ICON = 'https://cdn.jsdelivr.net/npm/@mdi/v7.2.96/svg/plus-box-outline.svg';
var BLACK_ICON = 'https://cdn.jsdelivr.net/npm/@mdi/v7.2.96/svg/plus-box-outline.svg';

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
          // 1. Get the current counter from Trello board storage (defaults to 1)
          let currentCount = await t.get('board', 'shared', 'ticketCounter', 1);

          // 2. Format your card name template with the ticket number
          let formattedId = String(currentCount).padStart(4, '0');
          let cardTitle = `#${formattedId} - Impress-Task`;

          // 3. Find the first list on the board to put the card into
          let board = await t.board('id', 'lists');
          if (!board.lists || board.lists.length === 0) {
            return t.alert({ message: 'No lists found on this board!', duration: 'error' });
          }
          let targetListId = board.lists[0].id;

          // 4. Create the new card by copying your template card (bdxPq3px) and overriding the name
          await t.rest('POST', '/1/cards', {
            name: cardTitle,
            idList: targetListId,
            pos: 'top',
            idCardSource: 'bdxPq3px'
          });

          // 5. Increment the counter and save it back to Trello's board storage
          await t.set('board', 'shared', 'ticketCounter', currentCount + 1);

          // 6. Success notification
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
  }
});
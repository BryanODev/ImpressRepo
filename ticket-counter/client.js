var WHITE_ICON =
  'https://cdn.jsdelivr.net/npm/@mdi/v7.2.96/svg/plus-box-outline.svg';

var BLACK_ICON =
  'https://cdn.jsdelivr.net/npm/@mdi/v7.2.96/svg/plus-box-outline.svg';

var TARGET_LIST_NAME = 'Inbox Solicitudes Nuevas';

var TEMPLATE_CARD_ID = '6a8cd9ecc1d994336094ee4b';

/*
 * This is your Trello Power-Up API key.
 *
 * Important:
 * The API key identifies the Power-Up.
 * The user's REST API token is obtained through Trello authorization.
 */
var API_KEY = 'eb1974fbb9e6a0def3d070da33e9cf05';


/*
 * ============================================================
 * CREATE TICKET
 * ============================================================
 */

async function createTicket(t, formData) {

  try {

    console.log('Creating ticket with form data:', formData);


    /*
     * ----------------------------------------------------------
     * Get REST API access
     * ----------------------------------------------------------
     */

    var restApi = await t.getRestApi();

    var token = await restApi.getToken();

    if (!token) {

      console.warn('No Trello REST API token available.');

      return t.popup({
        title: 'Authorize to continue',
        url: 'authorize.html',
        height: 140
      });
    }


    /*
     * ----------------------------------------------------------
     * Get current ticket counter
     * ----------------------------------------------------------
     */

    var currentCount = await t.get(
      'board',
      'shared',
      'ticketCounter',
      1
    );

    currentCount = Number(currentCount);

    if (isNaN(currentCount)) {
      currentCount = 1;
    }


    /*
     * ----------------------------------------------------------
     * Create formatted ticket number
     *
     * Example:
     * 1    -> #0001
     * 25   -> #0025
     * 1234 -> #1234
     * ----------------------------------------------------------
     */

    var formattedId = String(currentCount).padStart(4, '0');

    var cardTitle =
      '#' +
      formattedId +
      ' - ' +
      formData.cardTitleInput;


    /*
     * ----------------------------------------------------------
     * Find target list
     * ----------------------------------------------------------
     */

    var lists = await t.lists('id', 'name');

    var targetList = lists.find(function (list) {
      return list.name === TARGET_LIST_NAME;
    });


    if (!targetList) {

      console.error(
        'Target list not found:',
        TARGET_LIST_NAME
      );

      return t.alert({
        message:
          'List "' +
          TARGET_LIST_NAME +
          '" not found on this board!',
        duration: 'error'
      });
    }


    /*
     * ----------------------------------------------------------
     * Calculate due date
     *
     * Currently this sets the due date to 7 days from today.
     * ----------------------------------------------------------
     */

    var today = new Date();

    var weekLater = new Date(today);

    weekLater.setDate(
      today.getDate() + 7
    );

    var fechaSolicitada =
      weekLater.toISOString().split('T')[0];


    /*
     * ----------------------------------------------------------
     * Create the Trello card
     * ----------------------------------------------------------
     */

    console.log(
      'Creating Trello card:',
      cardTitle
    );

    var response = await fetch(
      'https://api.trello.com/1/cards' +
      '?key=' +
      encodeURIComponent(API_KEY) +
      '&token=' +
      encodeURIComponent(token),
      {
        method: 'POST',

        headers: {
          'Content-Type': 'application/json'
        },

        body: JSON.stringify({
          name: cardTitle,

          idList: targetList.id,

          pos: 'top',

          idCardSource: TEMPLATE_CARD_ID,

          due: fechaSolicitada
        })
      }
    );


    /*
     * ----------------------------------------------------------
     * Handle Trello API errors
     * ----------------------------------------------------------
     */

    if (!response.ok) {

      var errorText = await response.text();

      throw new Error(
        'Trello API error ' +
        response.status +
        ': ' +
        errorText
      );
    }


    /*
     * ----------------------------------------------------------
     * Card successfully created
     * ----------------------------------------------------------
     */

    var newCard = await response.json();

    console.log(
      'Ticket created successfully:',
      newCard
    );


    /*
     * ----------------------------------------------------------
     * Increment ticket counter
     * ----------------------------------------------------------
     */

    await t.set(
      'board',
      'shared',
      'ticketCounter',
      currentCount + 1
    );


    /*
     * ----------------------------------------------------------
     * Notify user
     * ----------------------------------------------------------
     */

    t.alert({
      message:
        'Created ticket #' +
        formattedId +
        '!',
      duration: 'success'
    });


    /*
     * ----------------------------------------------------------
     * Open newly created card
     * ----------------------------------------------------------
     */

    return t.showCard(newCard.id);


  } catch (error) {

    console.error(
      'Ticket creation failed:',
      error
    );

    t.alert({
      message:
        'Failed to create ticket card.',
      duration: 'error'
    });
  }
}


/*
 * ============================================================
 * OPEN TICKET FORM
 * ============================================================
 */

async function openTicketForm(t) {

  try {

    /*
     * Open the modal.
     *
     * IMPORTANT:
     * t.modal() does NOT return the form's object.
     *
     * The form calls t.notifyParent('done'), which triggers
     * this callback.
     */

    return t.modal({

      url: 'form.html',

      title: 'New Ticket Information',

      height: 600,

      /*
       * This callback runs when form.html calls:
       *
       *     t.notifyParent('done')
       *
       * It can also run when the user closes the modal.
       */
      callback: async function () {

        console.log(
          'Ticket form modal callback triggered.'
        );


        try {

          /*
           * Retrieve the data saved by form.html.
           */
          var formData = await t.get(
            'member',
            'private',
            'pendingTicketFormData'
          );


          /*
           * If there is no data, the user probably closed
           * the modal using X / Escape.
           */
          if (
            !formData ||
            typeof formData !== 'object' ||
            !formData.cardTitleInput
          ) {

            console.log(
              'Ticket creation cancelled or modal closed.'
            );

            return;
          }


          console.log(
            'Received ticket form data:',
            formData
          );


          /*
           * Remove the temporary form data immediately.
           *
           * This prevents old form data from being reused
           * if the modal is opened again.
           */
          try {

            await t.remove(
              'member',
              'private',
              'pendingTicketFormData'
            );

          } catch (removeError) {

            /*
             * Removing the temporary data isn't critical
             * to ticket creation, so don't fail the ticket
             * if this cleanup operation has an issue.
             */
            console.warn(
              'Could not remove temporary form data:',
              removeError
            );
          }


          /*
           * Create the actual Trello ticket.
           */
          await createTicket(
            t,
            formData
          );


        } catch (error) {

          console.error(
            'Failed processing ticket form:',
            error
          );

          t.alert({
            message:
              'Could not process ticket form.',
            duration: 'error'
          });
        }
      }
    });

  } catch (error) {

    console.error(
      'Form failed:',
      error
    );

    t.alert({
      message:
        'Could not open ticket form.',
      duration: 'error'
    });
  }
}


/*
 * ============================================================
 * AUTHORIZATION
 * ============================================================
 */

function authorizeUser(t) {

  return t.popup({
    title: 'Authorize to continue',
    url: 'authorize.html',
    height: 140
  });
}


/*
 * ============================================================
 * TRELLO POWER-UP INITIALIZATION
 * ============================================================
 */

window.TrelloPowerUp.initialize({

  /*
   * ----------------------------------------------------------
   * Board button
   * ----------------------------------------------------------
   */

  'board-buttons': function (t, opts) {

    return [
      {
        icon: {
          dark: WHITE_ICON,
          light: BLACK_ICON
        },

        text: 'Create Ticket',

        condition: 'edit',

        callback: async function (t) {

          try {

            /*
             * Check whether the user has authorized
             * REST API access.
             */

            var restApi =
              await t.getRestApi();

            var isAuthorized =
              await restApi.isAuthorized();


            if (!isAuthorized) {

              return authorizeUser(t);
            }


            /*
             * User is authorized, so open the form.
             */

            return openTicketForm(t);


          } catch (error) {

            console.error(
              'Authorization check failed:',
              error
            );

            return t.alert({
              message:
                'Could not check authorization.',
              duration: 'error'
            });
          }
        }
      }
    ];
  },


  /*
   * ----------------------------------------------------------
   * Authorization status
   * ----------------------------------------------------------
   */

  'authorization-status': async function (t, opts) {

    var restApi =
      await t.getRestApi();

    return {
      authorized:
        await restApi.isAuthorized()
    };
  },


  /*
   * ----------------------------------------------------------
   * Show authorization UI
   * ----------------------------------------------------------
   */

  'show-authorization': function (t, opts) {

    return authorizeUser(t);
  }

}, {

  /*
   * Your Trello Power-Up API key.
   */
  appKey: API_KEY,

  /*
   * Name shown for your Power-Up.
   */
  appName: 'Impress New Task'
});
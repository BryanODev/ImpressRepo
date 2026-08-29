```javascript
var WHITE_ICON = 'https://cdn.jsdelivr.net/npm/@mdi/v7.2.96/svg/plus-box-outline.svg';
var BLACK_ICON = 'https://cdn.jsdelivr.net/npm/@mdi/v7.2.96/svg/plus-box-outline.svg';

var TARGET_LIST_NAME = 'Inbox Solicitudes Nuevas';
var TEMPLATE_CARD_ID = '6a8cd9ecc1d994336094ee4b';
var API_KEY = 'eb1974fbb9e6a0def3d070da33e9cf05';


// ============================================================
// CREATE TICKET
// ============================================================

async function createTicket(t, formData) {

  try {

    console.log('CREATE TICKET CALLED');
    console.log('Form data:', formData);

    var restApi = await t.getRestApi();
    var token = await restApi.getToken();

    if (!token) {
      return t.popup({
        title: 'Authorize to continue',
        url: 'authorize.html',
        height: 140
      });
    }


    // ----------------------------------------------------------
    // Get ticket counter
    // ----------------------------------------------------------

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


    // ----------------------------------------------------------
    // Create ticket number
    // ----------------------------------------------------------

    var formattedId = String(currentCount).padStart(4, '0');

    var cardTitle =
      '#' +
      formattedId +
      ' - ' +
      formData.cardTitleInput;


    // ----------------------------------------------------------
    // Find target list
    // ----------------------------------------------------------

    var lists = await t.lists('id', 'name');

    var targetList = lists.find(function(list) {
      return list.name === TARGET_LIST_NAME;
    });

    if (!targetList) {

      return t.alert({
        message:
          'List "' +
          TARGET_LIST_NAME +
          '" not found on this board!',
        duration: 'error'
      });
    }


    // ----------------------------------------------------------
    // Due date = 7 days from today
    // ----------------------------------------------------------

    var today = new Date();
    var weekLater = new Date();

    weekLater.setDate(today.getDate() + 7);

    var fechaSolicitada =
      weekLater.toISOString().split('T')[0];


    // ----------------------------------------------------------
    // CREATE CARD
    // ----------------------------------------------------------

    console.log('ABOUT TO CREATE CARD:', cardTitle);

    var response = await fetch(
      'https://api.trello.com/1/cards' +
      '?key=' + encodeURIComponent(API_KEY) +
      '&token=' + encodeURIComponent(token),
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


    if (!response.ok) {

      var errorText = await response.text();

      throw new Error(
        'Trello API error ' +
        response.status +
        ': ' +
        errorText
      );
    }


    var newCard = await response.json();


    // ----------------------------------------------------------
    // Increment counter ONLY after successful card creation
    // ----------------------------------------------------------

    await t.set(
      'board',
      'shared',
      'ticketCounter',
      currentCount + 1
    );


    // ----------------------------------------------------------
    // Success
    // ----------------------------------------------------------

    t.alert({
      message:
        'Created ticket #' +
        formattedId +
        '!',
      duration: 'success'
    });

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


// ============================================================
// OPEN TICKET FORM
// ============================================================

async function openTicketForm(t) {

  try {

    console.log('OPENING TICKET FORM');


    // ----------------------------------------------------------
    // IMPORTANT:
    //
    // Delete any old submission BEFORE opening the form.
    //
    // This prevents an old submission from accidentally causing
    // a new card to be created when a new modal is opened.
    // ----------------------------------------------------------

    try {

      await t.remove(
        'member',
        'private',
        'pendingTicketSubmission'
      );

    } catch (cleanupError) {

      console.log(
        'No previous ticket submission to clear.'
      );
    }


    // ----------------------------------------------------------
    // Prevent duplicate callback processing
    // ----------------------------------------------------------

    var processingSubmission = false;


    // ----------------------------------------------------------
    // OPEN MODAL
    // ----------------------------------------------------------

    return t.modal({

      url: 'form.html',

      title: 'New Ticket Information',

      height: 600,


      // --------------------------------------------------------
      // THIS CALLBACK DOES NOT AUTOMATICALLY CREATE A CARD.
      //
      // It ONLY creates a card if form.html explicitly saved
      // "submitted: true".
      // --------------------------------------------------------

      callback: async function() {

        console.log(
          'MODAL CALLBACK FIRED'
        );


        // Prevent duplicate execution.
        if (processingSubmission) {

          console.log(
            'Submission already being processed.'
          );

          return;
        }


        try {

          // ----------------------------------------------------
          // Read the submission marker
          // ----------------------------------------------------

          var submission = await t.get(
            'member',
            'private',
            'pendingTicketSubmission'
          );


          // ----------------------------------------------------
          // If nothing was submitted, this was simply:
          //
          // X
          // Escape
          // Trello closing the modal
          //
          // DO NOT CREATE A CARD.
          // ----------------------------------------------------

          if (
            !submission ||
            submission.submitted !== true ||
            !submission.formData
          ) {

            console.log(
              'Modal closed WITHOUT submitting.'
            );

            return;
          }


          // ----------------------------------------------------
          // Mark as processing immediately.
          //
          // This prevents a second callback from creating
          // another card.
          // ----------------------------------------------------

          processingSubmission = true;


          var formData = submission.formData;


          console.log(
            'VALID SUBMISSION RECEIVED:',
            formData
          );


          // ----------------------------------------------------
          // Delete submission BEFORE creating card.
          //
          // This is important.
          // ----------------------------------------------------

          try {

            await t.remove(
              'member',
              'private',
              'pendingTicketSubmission'
            );

          } catch (removeError) {

            console.warn(
              'Could not remove submission marker:',
              removeError
            );
          }


          // ----------------------------------------------------
          // NOW — AND ONLY NOW — CREATE THE CARD
          // ----------------------------------------------------

          await createTicket(
            t,
            formData
          );


        } catch (error) {

          console.error(
            'Error processing ticket submission:',
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


// ============================================================
// AUTHORIZATION
// ============================================================

function authorizeUser(t) {

  return t.popup({
    title: 'Authorize to continue',
    url: 'authorize.html',
    height: 140
  });
}


// ============================================================
// POWER-UP INITIALIZATION
// ============================================================

window.TrelloPowerUp.initialize({

  // ----------------------------------------------------------
  // BOARD BUTTON
  // ----------------------------------------------------------

  'board-buttons': function(t, opts) {

    return [{
      icon: {
        dark: WHITE_ICON,
        light: BLACK_ICON
      },

      text: 'Create Ticket',

      condition: 'edit',

      callback: async function(t) {

        console.log(
          'BOARD CREATE TICKET BUTTON CLICKED'
        );


        var restApi = await t.getRestApi();

        var isAuthorized =
          await restApi.isAuthorized();


        if (!isAuthorized) {

          return authorizeUser(t);
        }


        // ------------------------------------------------------
        // IMPORTANT:
        //
        // This ONLY opens the form.
        //
        // It does NOT call createTicket().
        // ------------------------------------------------------

        return openTicketForm(t);
      }
    }];
  },


  // ----------------------------------------------------------
  // AUTHORIZATION STATUS
  // ----------------------------------------------------------

  'authorization-status': async function(t, opts) {

    var restApi = await t.getRestApi();

    return {
      authorized:
        await restApi.isAuthorized()
    };
  },


  // ----------------------------------------------------------
  // SHOW AUTHORIZATION
  // ----------------------------------------------------------

  'show-authorization': function(t, opts) {

    return authorizeUser(t);
  }

}, {

  appKey: API_KEY,

  appName: 'Impress New Task'
});
```

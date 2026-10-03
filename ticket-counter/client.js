var WHITE_ICON = 'https://bryano.dev/ImpressRepo/Assets/ImpressIcon.png';

var BLACK_ICON = 'https://bryano.dev/ImpressRepo/Assets/ImpressIcon.png';

var API_KEY = 'eb1974fbb9e6a0def3d070da33e9cf05';


/*
 * Opens Trello's authorization popup.
 */
function authorizeUser(t) {

    return t.popup({
        title: 'Authorize to continue',
        url: 'autorize.html',
        height: 140
    });

}


/*
 * Opens the New Ticket form.
 *
 * The actual card creation happens inside form.html
 * after the user submits the form.
 */
function openTicketForm(t) {

    return t.popup({
        title: 'New Ticket',
        url: 'form.html',
        height: 600
    });

}


window.TrelloPowerUp.initialize({

    /*
     * Board Buttons
     */
    'board-buttons': function (t, opts) {

        return [
            {
                icon: {
                    dark: WHITE_ICON,
                    light: BLACK_ICON
                },

                text: 'Create Job',

                condition: 'edit',

                callback: async function (t) {

                    try {

                        var restApi = await t.getRestApi();

                        var isAuthorized =
                            await restApi.isAuthorized();

                        /*
                         * User hasn't authorized the
                         * Power-Up yet.
                         */
                        if (!isAuthorized) {

                            return authorizeUser(t);

                        }

                        /*
                         * Already authorized.
                         * Open the ticket form.
                         */
                        return openTicketForm(t);

                    } catch (error) {

                        console.error(
                            'Create Ticket button failed:',
                            error
                        );

                        return t.alert({
                            message: 'Unable to open ticket form.',
                            duration: 'error'
                        });

                    }

                }
            }
        ];

    },


    /*
     * Trello asks the Power-Up whether
     * the current user is authorized.
     */
    'authorization-status': async function (t, opts) {

        try {

            var restApi = await t.getRestApi();

            var isAuthorized =
                await restApi.isAuthorized();

            return {
                authorized: isAuthorized
            };

        } catch (error) {

            console.error(
                'Authorization status failed:',
                error
            );

            return {
                authorized: false
            };

        }

    },


    /*
     * Called by Trello when authorization
     * needs to be shown manually.
     */
    'show-authorization': function (t, opts) {

        return authorizeUser(t);

    }


}, {

    appKey: API_KEY,
    appName: 'Impress New Task'

});
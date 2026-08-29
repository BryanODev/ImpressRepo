const ICON = 'https://cdn.jsdelivr.net/npm/@mdi/v7.2.96/svg/table.svg';

window.TrelloPowerUp.initialize({

  'card-back-section': function (t, options) {

    return {
      title: 'Items',
      icon: ICON,

      content: {
        type: 'iframe',
        url: t.signUrl('./table.html'),
        height: 400
      }
    };
  }

});
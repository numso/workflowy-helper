var render = require('./render');

$('.makeList').click(function (e) {
  var items = [
    {
      href: '#',
      name: 'one'
    },
    {
      href: '#',
      name: 'two'
    },
    {
      href: '#',
      name: 'three'
    }
  ];

  $('.lists').append(render('list', { title: 'test', items: items }));
});

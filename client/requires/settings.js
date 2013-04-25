var render = require('./render');

$('.deleteButton').click(function () {
  $(this).closest('.wfLabel').remove();
});

$('.addNew').click(function () {
  $(this).before(render('settingsItem'));

  $('.deleteButton').last().click(function () {
    $(this).closest('.wfLabel').remove();
  });

  $('.wfName').last().focus();
});

$('.saveAll').click(function () {
  saveAll();
});

function saveAll() {
  var settings = {
    showCalendar: !!$('.showCal-val').attr('checked'),
    wfCookie: $('.wfCookie-val').val(),
    wfQs: $('.wfQs-val').val(),
    defaultColor: $('.wfColor-val').val(),
    wfLabels: []
  };

  var labels = $('.wfLabel');
  for (var i = 0; i < labels.length; ++i) {
    var label = $(labels[i]);
    var myObj = {
      name: label.find('.wfName').val(),
      id: label.find('.wfID').val(),
      disp: !!label.find('.wfDisp').attr('checked')
    };

    if (myObj.name && myObj.id)
      settings.wfLabels.push(myObj);
  }

  $.post('/updateSettings', {settings: settings}, function () {
    alert('Settings Successfully Saved!!');
    window.location.reload();
  });
};

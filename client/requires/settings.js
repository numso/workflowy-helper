$('.deleteButton').click(function () {
  $(this).closest('.wfLabel').remove();
});

$('.addNew').click(function () {
  $(this).before('<div class="wfLabel"><span>name:</span><input type="text" class="wfName"><span>id:</span><input type="text" class="wfID"><span class="deleteButton">x</span></div>');

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
    wfLabels: []
  };

  var labels = $('.wfLabel');
  for (var i = 0; i < labels.length; ++i) {
    var label = $(labels[i]);
    var myObj = {
      name: label.find('.wfName').val(),
      id: label.find('.wfID').val()
    };

    if (myObj.name && myObj.id)
      settings.wfLabels.push(myObj);
  }

  $.post('/updateSettings', {settings: settings}, function () {
    alert('Settings Successfully Saved!!');
    window.location.reload();
  });
};

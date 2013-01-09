$(function () {
  bindHandlers();
  $($('input')[0]).focus();
});

function bindHandlers() {
  $('input[type=button]').click(function (e) {
    processLogin();
  });

  $('.password-field').keypress(function (e) {
    if (e.keyCode === 13)
      processLogin();
  });
};

function processLogin() {
  var userObj = {
    user: $('.user-field').val(),
    pass: $('.password-field').val()
  };

  if (!validate(userObj)) {
    $($('input')[0]).focus();
  } else {
    $('.login-info').css('color', '');
    $('.login-info').text('Validating...');
    $.post('/login', userObj, function (data) {
      if (data.status === "ok") {
        window.location = '/';
      } else {
        $('.login-info').css('color', 'red');
        $('.login-info').text(data.msg);
        $($('input')[0]).focus();
      }
    });
  }
};

function validate(user) {
  $('input').css('border-color', '');
  var isValid = true;

  if (!user.pass) {
    $('.password-field').css('border-color', 'red');
    isValid = false;
  }

  if (!user.user) {
    $('.user-field').css('border-color', 'red');
    isValid = false;
  }

  return isValid;
};
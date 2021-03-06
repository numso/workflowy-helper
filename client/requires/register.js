$('input[type=button]').click(function (e) {
  processRegistration();
});

$('.cpass').keypress(function (e) {
  if (e.keyCode === 13)
    processRegistration();
});

$($('input')[0]).focus();


function processRegistration() {
  var userObj = {
    fname: $('.fname').val(),
    lname: $('.lname').val(),
    user: $('.user').val(),
    email: $('.email').val(),
    pass: $('.pass').val(),
    cpass: $('.cpass').val(),
  };

  if (!validate(userObj)) {
    $($('input')[0]).focus();
  } else {
    $('.register-info').css('color', '');
    $('.register-info').text('Validating...');

    $.post('/register', userObj, function (data) {
      if (data.status === "ok") {
        window.location = '/';
      } else {
        $('.register-info').css('color', 'red');
        $('.register-info').text(data.msg);
        $($('input')[0]).focus();
      }
    });
  }
};

function validate(user) {
  $('input').css('border-color', '');
  var isValid = true;

  if (!user.fname) {
    $('.fname').css('border-color', 'red');
    isValid = false;
  }

  if (!user.lname) {
    $('.lname').css('border-color', 'red');
    isValid = false;
  }

  if (!user.user) {
    $('.user').css('border-color', 'red');
    isValid = false;
  }

  if (!user.email) {
    $('.email').css('border-color', 'red');
    isValid = false;
  }

  if (!user.pass) {
    $('.pass').css('border-color', 'red');
    isValid = false;
  }

  if (!user.cpass) {
    $('.cpass').css('border-color', 'red');
    isValid = false;
  }

  if (user.pass !== user.cpass) {
    $('.cpass').css('border-color', 'red');
    isValid = false;
  }

  return isValid;
};

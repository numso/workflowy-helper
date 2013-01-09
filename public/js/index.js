$(function () {

  startCalendar();

  if ($('.wfItems').length) {
    var groups = [];
    var candidates = $('.wfItems');
    for (var i = 0; i < candidates.length; ++i)
      groups.push($(candidates[i]).data('wfid'));
    startWorkflowy(groups);
  }

  $('.showHidden').click(function (e) {
    $(this).closest('.list').find('.completed').toggle();
  });
});

function startCalendar() {
  $('#calendar').fullCalendar({
    header: {
    left:   'prev,next today',
    center: 'title',
    right:  'month,basicWeek,basicDay'
}
  });
};

function startWorkflowy(groups) {
  $.get('/getWorkflowy', function (data) {
    $('.loading').remove();
    if (!data.success) return alert("Error: invalid workflowy cookie");
    populateWorkflowy(data.workflowy, groups);
  });

  // $('.refresh-wf').click(function () {
  //   $.get('/getWorkflowy', function (data) {
  //     if (!data.success) return "Error: tell the user";
  //     populateWorkflowy(data.workflowy);
  //   });
  // });
};

function populateWorkflowy(wf, groups) {
  var data = {};
  for (var i = 0; i < groups.length; ++i)
    data[groups[i]] = [];

  getTheData(wf, data, groups);

  for (var i = 0; i < groups.length; ++i) {
    for (var j = 0; j < data[groups[i]].length; ++j) {
      var item = data[groups[i]][j]

      var dueDate = false;
      var dashIndex = item.name.indexOf('---');
      if (dashIndex !== -1) {
        var dueDate = item.name.substr(dashIndex + 3, item.name.length);
        item.name = item.name.substr(0, dashIndex);
      }

      var el = $('<a>')
        .text(item.name)
        .attr('href', item.linkName)
        .addClass(item.className);

      dueDate = dueDate ? '<div>due on ' + dueDate + '</div>' : '';

      el = $('<div>')
        .append(el)
        .append(dueDate);

      $('.wfItems[data-wfid="' + groups[i] + '"]').append(el);
    }
  }

};

function getTheData(node, data, groups) {
  for (var i = 0; i < node.length; ++i) {

    for (var j = 0; j < groups.length; ++j) {
      if (node[i].nm.indexOf(groups[j]) !== -1 && node[i].nm.indexOf('#no') === -1) {
        data[groups[j]].push({
          name: node[i].nm,
          className: !!node[i].cp ? 'completed' : '',
          linkName: '//www.workflowy.com/#/' + node[i].id
        });
      }
    }

    if (node[i].ch && node[i].ch.length)
      getTheData(node[i].ch, data, groups);
  }
};

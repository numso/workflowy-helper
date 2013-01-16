var render = require('./render');

var calEvents = [];

$('#calendar').fullCalendar({
  header: {
    left:   'prev,next today',
    center: 'title',
    right:  'month,basicWeek,basicDay'
  }
});

function refreshCalendarEvents() {
  $('#calendar').fullCalendar('removeEvents');
  $('#calendar').fullCalendar('addEventSource', { events: calEvents });
  $('#calendar').fullCalendar('rerenderEvents');
};

function initializeWorkflowy() {
  if (!$('.wfItems').length)
    return $('.loading').remove();

  $.get('/getWorkflowy', function (data) {
    $('.loading').remove();
    if (!data.success) return alert("Error: invalid workflowy cookie");
    parseWFEvents(data.workflowy, getGroups());
    refreshCalendarEvents();
  });

  $('.showHidden').click(function (e) {
    $(this).closest('.list').find('.completed').toggle();
  });
};

function getGroups() {
  var groups = [];
  var allLists = $('.wfItems');
  for (var i = 0; i < allLists.length; ++i)
    groups.push($(allLists[i]).data('wfid'));
  return groups;
};

function parseWFEvents(wf, groups) {
  for (var i = 0; i < wf.length; ++i) {
    isTagged(wf[i]);
    if (wf[i].ch && wf[i].ch.length)
      parseWFEvents(wf[i].ch, groups);
  }

  function isTagged(item) {
    for (var i = 0; i < groups.length; ++i)
      if (item.nm.indexOf(groups[i]) !== -1 && item.nm.indexOf('#no') === -1)
        addItem(item, groups[i]);
  };
};

function addItem(item, group) {
  var sections = item.nm.split('---')
    , color = grabColor(sections)
    , start = grabDate(sections)
    , title = sections.join('---')
    ;

  var event = {
    title: title,
    allDay: true,
    start: start,
    color: color,
    url: '//www.workflowy.com/#/' + item.id,
    completed: !!item.cp
  };

  if (event.start)
    calEvents.push(event);

  $('.wfItems[data-wfid="' + group + '"]').append(render('listItem', event));

  function grabColor(sections) {
    for (var i = 1; i < sections.length; ++i) {
      var section = sections[i];
      if (section.indexOf('color') !== -1) {
        section = section.replace('color', '');
        section = section.trim();
        sections = sections.splice(i, 1);
        return section;
      }
    }
    return '';
  };

  function grabDate(sections) {
    for (var i = 1; i < sections.length; ++i) {
      var section = sections[i];
      if (section.indexOf('due') !== -1) {
        section = section.replace('due', '');
        section = section.trim();
        section = dateFromString(section);
        sections = sections.splice(i, 1);
        return section;
      }
    }
    return '';
  };
};

function dateFromString(str) {
  var datePieces = str.split('/')
    , today = new Date()
    , month = today.getMonth()
    , day = today.getDate()
    , year = today.getFullYear();

  if (datePieces.length === 1) {
    day = parseInt(datePieces[0], 10);
  }

  if (datePieces.length === 2) {
    month = parseInt(datePieces[0], 10) - 1;
    day = parseInt(datePieces[1], 10);
  }

  if (datePieces.length === 3) {
    month = parseInt(datePieces[0], 10) - 1;
    day = parseInt(datePieces[1], 10);
    year = parseInt(datePieces[2], 10);
  }

  return new Date(year, month, day, 0, 0, 0, 0);
};

module.exports = initializeWorkflowy;

var render = require('./render');

var calEvents = [];

$('#calendar').fullCalendar({
  selectable: true,
  header: {
    left:   'prev,next today',
    center: 'title',
    right:  'month,basicWeek,basicDay'
  }
});

function refreshCalendarEvents() {
  var tempEvents = [];
  for (var i = 0; i < calEvents.length; ++i)
    if (shouldShow(calEvents[i]))
      tempEvents.push(calEvents[i]);

  $('#calendar').fullCalendar('removeEvents');
  $('#calendar').fullCalendar('addEventSource', { events: tempEvents });
  $('#calendar').fullCalendar('rerenderEvents');

  function shouldShow(evt) {
    var show = !evt.completed
      , showHidden = !!$('[data-wfid=' + evt.id + ']').closest('.list').find('input').attr('checked');

    return show || showHidden;
  };
};

function initializeWorkflowy(defColor) {
  defColor = defColor || 'black';

  if (!$('.wfItems').length)
    return $('.loading').remove();

  $.get('/getWorkflowy', function (data) {
    $('.loading').remove();
    if (!data.success) return alert("Error: invalid workflowy cookie");
    parseWFEvents(data.workflowy, getGroups(), defColor);
    refreshCalendarEvents();
    $('.linkToCal').click(function () {
      var date = new Date($(this).data('date'));
      $('#calendar').fullCalendar('gotoDate', date.getFullYear(), date.getMonth(), date.getDate());
      $('#calendar').fullCalendar('select', date);
    });
  });

  $('.showHidden').click(function (e) {
    $(this).closest('.list').find('.completed').slideToggle(200);
    refreshCalendarEvents();
  });
};

function getGroups() {
  var groups = [];
  var allLists = $('.wfItems');
  for (var i = 0; i < allLists.length; ++i)
    groups.push({
      id: $(allLists[i]).data('wfid'),
      disp: $(allLists[i]).data('wfdisp')
    });
  return groups;
};

function parseWFEvents(wf, groups, color) {
  for (var i = 0; i < wf.length; ++i) {
    var sections = wf[i].nm.split('---')
      , newColor = grabColor(sections) || color;

    isTagged(wf[i], newColor);
    if (wf[i].ch && wf[i].ch.length)
      parseWFEvents(wf[i].ch, groups, newColor);
  }

  function isTagged(item, color) {
    for (var i = 0; i < groups.length; ++i)
      if (item.nm.indexOf(groups[i].id) !== -1 && item.nm.indexOf('#no') === -1)
        addItem(item, groups[i], color);
  };
};

function addItem(item, group, color) {
  var sections = item.nm.split('---')
    , color = grabColor(sections) || color
    , start = grabDate(sections)
    , title = sections.join('---')
    , important = title.indexOf('#important') !== -1
    ;

  var re = new RegExp("#important", "g");
  title = title.replace(re, '');

  if (!group.disp) {
    re = new RegExp(group.id, "g");
    title = title.replace(re, '');
  }

  var event = {
    id: group.id,
    title: title,
    allDay: true,
    start: start,
    color: color,
    url: '//www.workflowy.com/#/' + item.id,
    completed: !!item.cp,
    important: important
  };

  if (event.start)
    calEvents.push(event);

  $('.wfItems[data-wfid="' + group.id + '"]').append(render('listItem', event));

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

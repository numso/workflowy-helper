var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

var calEvents = [];

$(function () {
  initializeCalendar();
  initializeWorkflowy();
});

function initializeCalendar() {
  $('#calendar').fullCalendar({
    header: {
      left:   'prev,next today',
      center: 'title',
      right:  'month,basicWeek,basicDay'
    }
  });
};

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
    , completed = !!item.cp;

  var event = {
    title: title,
    allDay: true,
    start: start,
    color: color,
    url: '//www.workflowy.com/#/' + item.id
  };

  if (event.start)
    calEvents.push(event);

  $('.wfItems[data-wfid="' + group + '"]').append(renderMyItem(event, completed));

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
    return undefined;
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
    return undefined;
  };

  function renderMyItem(event, completed) {
    var duedate = !!event.start ? '<div>due on ' + MONTHS[event.start.getMonth()] + " " + event.start.getDate() + '</div>': '';
    var colorStyle = !!event.color ? ' style="color: ' + event.color + '"' : '';
    var klass = completed ? ' class="completed"' : '';
    return '<div' + colorStyle + '><a' + colorStyle + ' href="' + event.url + '"' + klass + '">' + event.title + '</a>' + duedate + '</div>';
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

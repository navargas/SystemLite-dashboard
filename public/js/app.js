var actions = {
  set_state: function(data) {
    var state = data.state;
    svgCanvas.setState(state.objects);
    svgControls.setPalette(data.palette);
    tabs.setTabs(state.tabs);
    if (data.useTab !== undefined) {
      switchToTab(tabs.compList, data.useTab)
    } else {
      if (svgCanvas.onTab >= tabs.compList.length)
        svgCanvas.onTab = tabs.compList.length - 1
      switchToTab(tabs.compList, svgCanvas.onTab || 0)
    }
  },
  update_status: function(data) {
    /* Only update container status on current tab */
    var items = svgCanvas.circles;
    for (index in items) {
      if (data.running[items[index].label]) {
        items[index].statusColor = 'lightgreen';
      } else {
        items[index].statusColor = 'red';
      }
    }
  },
  log: function(data) {
    logger.log(data.message, data.severity, data.source);
  }
};

function getCookie(name) {
  var value = "; " + document.cookie;
  var parts = value.split("; " + name + "=");
  if (parts.length == 2) return parts.pop().split(";").shift();
}

function onmessage(event) {
  var incomming = JSON.parse(event.data);
  if (incomming.cmd) {
    if (!actions[incomming.cmd]) {
      console.warn('Unrecognized command', incomming.cmd);
      return;
    }
    actions[incomming.cmd](incomming.data);
  }
}

var ws = null;
var username = 'DEBUG';
var session = getCookie('session');

function Initialize() {
  logger.log('Connecting to server...');
  var connectionAttempt = undefined;
  function attemptConnection(schedule) {
    ws = new WebSocket("ws://" + document.location.host + "/ws");
    ws.onopen = function(event) {
      logger.log('Connected!');
      ws.send(JSON.stringify({
        cmd:'initalize_connection',
        data: {'workspace': username}
      }));
    }
    ws.onmessage = onmessage,
    ws.onerror = function(event) {
    }
    ws.onclose = function(event) {
      logger.log('Unable to connect to ' + document.location.host, 'alert');
    }
  };
  function check(){
    if(!ws || ws.readyState == 3) attemptConnection();
  }

  attemptConnection();

  setInterval(check, 5000);
}

document.addEventListener('DOMContentLoaded', Initialize);

document.addEventListener("dispatchMessage", function(data) {
  ws.send(JSON.stringify(data));
}, false);

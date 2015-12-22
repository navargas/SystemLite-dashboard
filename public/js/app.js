var actions = {
  set_state: function(data) {
    svgCanvas.setState(data.objects);
    tabs.setTabs(data.tabs);
  }
};

function onmessage(event) {
  var incomming = JSON.parse(event.data);
  if (incomming.cmd) {
    if (!actions[incomming.cmd]) {
      console.log('Unrecognized command', incomming.cmd);
      return;
    }
    actions[incomming.cmd](incomming.data);
  }
}

function Initialize() {
  logger.log('Connecting to server...');
  var connectionAttempt = undefined;
  var ws = null;
  function attemptConnection(schedule) {
    ws = new WebSocket("ws://" + document.location.host + "/ws");
    ws.onopen = function(event) {
      logger.log('Connected!');
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

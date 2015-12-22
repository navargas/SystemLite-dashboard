function Initialize() {
  logger.log('Connecting to server...');
  var connectionAttempt = undefined;
  var ws = null;
  function attemptConnection(schedule) {
    ws = new WebSocket("ws://" + document.location.host + "/ws");
    ws.onopen = function(event) {
      logger.log('Connected!');
    };
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

var sampleData = [
  {msg: "Welcome to SystemLite!", level:'debug', ts:1450658798286}
];

var logger = new Vue({
  el: '#logelement',
  methods: {
    hideLogs: function() {
      this.isHidden = true;
    },
    showLogs: function() {
      this.isHidden = false;
      this.stopAlert();
    },
    startAlert: function() {
      var that = this;
      this.alertInterval = setInterval(function() {
        that.flashRed = !that.flashRed;
      }, 1000);
    },
    stopAlert: function() {
      if (this.alertInterval) {
        clearInterval(this.alertInterval);
      }
      this.flashRed = false;
    },
    clearLogs: function() {
      this.logData = [];
    },
    log: function(message, severity) {
      if (severity == 'alert' && this.isHidden) {
        this.startAlert();
        setTimeout(this.stopAlert, 2000);
      }
      this.logData.push(
        {msg:message, level:severity||'system',ts:Date.now()}
      );
    }
  },
  data: {
    logData: sampleData,
    isHidden: false,
    flashRed: false
  }
});

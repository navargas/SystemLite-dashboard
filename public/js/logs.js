var sampleData = [
  {msg: "Welcome to SystemLite!", level:'debug', ts:1450658798286, count:0}
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
      if (message == this.lastMessage) {
        // Do not show repeated log messages, instead increment count
        this.logData[this.logData.length - 1].count += 1;
        this.logData[this.logData.length - 1].ts = Date.now();
        return;
      }
      this.logData.push(
        {msg:message, level:severity||'system',ts:Date.now(), count:0}
      );
      this.lastMessage = message;
    }
  },
  data: {
    lastMessage: null,
    logData: sampleData,
    isHidden: false,
    flashRed: false
  }
});

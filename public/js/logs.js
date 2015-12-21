var sampleData = [
  {msg: "Welcome to SystemLite!", level:'debug', ts:1450658798286}
];

var logger = new Vue({
  el: '#logelement',
  methods: {
    hideLogs: function() {
      this.isHidden = true;
      console.log('show');
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
    log: function(message, severity) {
      this.logData.push(
        {msg:message, level:severity||'debug',ts:Date.now()}
      );
    }
  },
  data: {
    logData: sampleData,
    isHidden: true,
    flashRed: false
  }
});

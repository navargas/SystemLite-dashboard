var hud = new Vue({
  el: '#hud',
  methods: {
    showConfirm: function(promptMessage, callback) {
      this.clearBox();
      this.activePanel = 'confirm';
      this.confirmPanel.prompt = promptMessage;
      this.activeCallback = callback;
    },
    clearBox: function() {
      this.confirmPanel.prompt = undefined;
      this.activePanel = 'none';
      this.activeCallback = undefined;
    },
    confirmClick: function() {
      data = {};
      if (this.activeCallback)
        this.activeCallback(data)
      hud.clearBox();
    },
    closeBox: function() {
      this.activePanel = 'none';
    }
  },
  data: {
    activePanel: 'none',
    confirmPanel: {
      prompt: undefined
    },
    activeCallback: undefined,
    isHidden: true
  }
});

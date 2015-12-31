var hud = new Vue({
  el: '#hud',
  methods: {
    showConfirm: function(promptMessage, callback, negativeCallback) {
      this.clearBox();
      this.activePanel = 'confirm';
      this.confirmPanel.prompt = promptMessage;
      this.affirmativeCallback = callback;
      this.negativeCallback = negativeCallback;
    },
    clearBox: function() {
      this.confirmPanel.prompt = undefined;
      this.activePanel = 'none';
      this.affirmativeCallback = undefined;
      this.negativeCallback = undefined;
    },
    affirmativeClick: function() {
      data = {};
      if (this.affirmativeCallback)
        this.affirmativeCallback(data);
      hud.clearBox();
    },
    negativeClick: function() {
      data = {};
      if (this.negativeCallback)
        this.negativeCallback(data);
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
    affirmativeCallback: undefined,
    negativeCallback: undefined,
    isHidden: true
  }
});

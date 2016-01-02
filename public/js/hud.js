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
    showNewItem: function(callback, negativeCallback) {
      this.clearBox();
      this.activePanel = 'new item';
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
      if (this.activePanel == 'new item') {
        data.inColor = this.newItemPanel.previewColor;
        data.nodeName = document.getElementById('nodeNameInput').value;
        data.image = document.getElementById('imageNameInput').value;
      }
      if (this.affirmativeCallback)
        this.affirmativeCallback(data);
      hud.clearBox();
    },
    colorChange: function(event) {
      this.newItemPanel.previewColor = event.srcElement.value;
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
    newItemPanel: {
      previewColor: '#AA0000'
    },
    affirmativeCallback: undefined,
    negativeCallback: undefined,
    isHidden: true
  }
});

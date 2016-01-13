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
    showNetworkNode: function(callback, negativeCallback) {
      this.clearBox();
      this.activePanel = 'network node';
      this.affirmativeCallback = callback;
      this.negativeCallback = negativeCallback;
    },
    showNewItem: function(callback, negativeCallback) {
      this.clearBox();
      this.activePanel = 'new item';
      this.affirmativeCallback = callback;
      this.negativeCallback = negativeCallback;
    },
    showNodeSettings: function(node, callbacks) {
      this.clearBox();
      this.nodeSettingsPanel.name = node.label;
      this.activePanel = 'node settings';
      this.affirmativeCallback = callbacks.accept;
      this.negativeCallback = callbacks.cancel;
      this.deleteCallback = callbacks.deleteNode;
    },
    showPaletteAction: function(node, imageStatus, callbacks) {
      // actions: deleteItem, accept, modify (in negative)
      this.clearBox();
      this.activePanel = 'palette node';
      this.paletteActionPanel.imageStatus = imageStatus;
      this.affirmativeCallback = callbacks.accept;
      this.negativeCallback = callbacks.modify;
      this.deleteCallback = callbacks.deleteItem;
    },
    deleteNode: function() {
      var callback = this.deleteCallback;
      this.clearBox();
      if (callback) callback();
    },
    clearBox: function() {
      this.confirmPanel.prompt = undefined;
      this.activePanel = 'none';
      this.paletteActionPanel.imageStatus = undefined;
      this.affirmativeCallback = undefined;
      this.negativeCallback = undefined;
      this.deleteCallback = undefined;
    },
    affirmativeClick: function() {
      data = {};
      if (this.activePanel == 'new item') {
        data.inColor = this.newItemPanel.previewColor;
        data.nodeName = document.getElementById('nodeNameInput').value;
        data.image = document.getElementById('imageNameInput').value;
      } else if (this.activePanel == 'network node') {
        data.container = document.getElementById('networkNodeContainer').value;
        data.host = document.getElementById('networkNodeHost').value;
      } else if (this.activePanel == 'node settings') {
        data.newName = this.nodeSettingsPanel.name;
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
    nodeSettingsPanel: {
      name: 'testing'
    },
    paletteActionPanel: {
      imageStatus: undefined
    },
    affirmativeCallback: undefined,
    negativeCallback: undefined,
    deleteCallback: undefined,
    isHidden: true
  }
});

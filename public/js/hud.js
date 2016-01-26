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
    showNewItem: function(callback, prefill) {
      this.clearBox();
      this.activePanel = 'new item';
      this.affirmativeCallback = callback;
      if (prefill) {
        this.newItemPanel.previewColor = prefill.fill;
        this.newItemPanel.imageName = prefill.image;
        this.newItemPanel.nodeName = prefill.name;
        this.newItemPanel.env = prefill.env || [];
      } else {
        this.newItemPanel.previewColor = '#AA0000';
        this.newItemPanel.imageName = '';
        this.newItemPanel.nodeName = '';
        this.newItemPanel.env = [];
      }
    },
    showNodeSettings: function(node, callbacks) {
      this.clearBox();
      this.nodeSettingsPanel.name = node.label;
      this.activePanel = 'node settings';
      this.affirmativeCallback = callbacks.accept;
      this.negativeCallback = callbacks.cancel;
      this.deleteCallback = callbacks.deleteNode;
      this.callbacks = callbacks;
    },
    callCallback: function(callbackName) {
      var cb = this.callbacks[callbackName];
      this.clearBox();
      if (cb) cb();
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
      this.callbacks = {};
      this.paletteActionPanel.imageStatus = undefined;
      this.affirmativeCallback = undefined;
      this.negativeCallback = undefined;
      this.deleteCallback = undefined;
    },
    affirmativeClick: function() {
      data = {};
      if (this.activePanel == 'new item') {
        data.inColor = this.newItemPanel.previewColor;
        data.nodeName = this.newItemPanel.nodeName;
        data.image = this.newItemPanel.imageName;
        data.env = this.newItemPanel.env;
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
      var cb = this.negativeCallback;
      hud.clearBox();
      if (cb) cb(data);
    },
    newKeypair: function(index) {
      this.newItemPanel.env.push(['', '']);
    },
    deleteKeypair: function(index) {
      this.newItemPanel.env.$remove(this.newItemPanel.env[index]);
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
      env: [],
      previewColor: '#AA0000',
      imageName: '',
      nodeName: ''
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
    callbacks: {},
    isHidden: true
  }
});

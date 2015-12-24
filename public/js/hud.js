var hud = new Vue({
  el: '#hud',
  methods: {
    closeBox: function() {
      this.isHidden = true;
    }
  },
  data: {
    isHidden: true
  }
});

default1 = {   inColor: "#2B754F",  outColor:"#043E21"   }
default2 = {   inColor: "#8E345A",  outColor:"#4B0422"   }
default3 = {   inColor: "#A67A3D",  outColor:"#583505"   }
completeState = [
  {circles: [
    {label:"Obj1", x:320, y:100, r:10, style:default1},
    {label:"Obj1", x:70,  y:100, r:20, style:default2},
    {label:"Obj1", x:70,  y:50,  r:20, style:default3}
  ]}
];
emptyState = {
  circles: []
};

var svgCanvas = new Vue({
  el: '#svgCanvas',
  methods: {
    zoom: function(factor) {
      //var format = /scale\(([-+]?[0-9]*\.?[0-9]*)\)/;
      // i.e extract Number -3.2 from "scale(-3.2)"
      this.scaleFactor += factor;
    },
    mouseMove: function(event) {
      var dx = event.x - this.mouse.x;
      var dy = event.y - this.mouse.y;
      this.mouse.x = event.x;
      this.mouse.y = event.y;
      if (this.currentTarget !== undefined) {
        this.currentTarget.x += dx / this.scaleFactor;
        this.currentTarget.y += dy / this.scaleFactor;
      }
    },
    dragStart: function(event, index) {
      this.currentTarget = this.circles[index];
    },
    showTab: function(tab) {
      var onState = completeState[tab];
      if (!onState) {
        onState = emptyState;
      }
      this.circles = onState.circles;
    },
    dragStop: function(event, index) {
      this.currentTarget = undefined;
    }
  },
  data: {
    scaleFactor: 3,
    scaleFactorStyle: 'scale(3)',
    mouse: {x:0, y:0},
    currentTarget: undefined,
    completeState: completeState,
    circles: []
  }
});

svgCanvas.showTab(0);

document.addEventListener("switchTab", function(data) {
  console.log('Got switchTab event', data.index);
  svgCanvas.showTab(data.index);
}, false);

svgCanvas.$watch('scaleFactor', function(val) {
  this.scaleFactorStyle = 'scale(' + val  + ')';
});

var svgControls = new Vue({
  el: '#canvasControl',
  methods: {
    scaleSvgButton: function(direction) {
      svgCanvas.zoom(direction * .4);
    }
  },
  data: {
  }
});

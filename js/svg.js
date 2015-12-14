default1 = {   inColor: "#2B754F",  outColor:"#043E21"   }
default2 = {   inColor: "#8E345A",  outColor:"#4B0422"   }
default3 = {   inColor: "#A67A3D",  outColor:"#583505"   }
circles = [
  {label:"Obj1", x:320, y:100, r:10, style:default1},
  {label:"Obj1", x:70,  y:100, r:20, style:default2},
  {label:"Obj1", x:70,  y:50,  r:20, style:default3},
];

var svgCanvas = new Vue({
  el: '#svgCanvas',
  methods: {
    zoom: function(factor) {
      var format = /scale\(([-+]?[0-9]*\.?[0-9]*)\)/;
      // i.e extract Number -3.2 from "scale(-3.2)"
      var currentScale = parseFloat(format.exec(this.scaleFactor.transform)[1]);
      currentScale += factor;
      this.scaleFactor.transform = 'scale(' + currentScale + ')';
    },
    dragStart: function(event, index) {
      console.log('Object click down', event, index);
    }
  },
  data: {
    scaleFactor: {transform: 'scale(3)'},
    circles: circles
  }
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

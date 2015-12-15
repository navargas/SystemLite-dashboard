default1 = {   inColor: "#2B754F",  outColor:"#043E21"   }
default2 = {   inColor: "#8E345A",  outColor:"#4B0422"   }
default3 = {   inColor: "#A67A3D",  outColor:"#583505"   }
default4 = {   inColor: "#2B2E75",  outColor:"#131535"   }
completeState = [
  {circles: [
    {label:"PostgreSQL", x:260, y:100, r:30, style:default1},
    {label:"Dashboard_1", x:130,  y:130, r:20, style:default2},
    {label:"Dashboard_2", x:130,  y:50, r:20, style:default2},
    {label:"Load_Balancer", x:70,  y:100, r:20, style:default4},
    {label:"Redis_Cache", x:180,  y:100, r:10, style:default3}
  paths: []},
  {circles: [
    {label:"Obj1", x:50,  y:100, r:20, style:default1},
    {label:"Obj1", x:100, y:100, r:20, style:default1},
    {label:"Obj1", x:150, y:100, r:20, style:default1},
    {label:"Obj1", x:50,  y:200, r:20, style:default2},
    {label:"Obj1", x:100, y:200, r:20, style:default2},
    {label:"Obj1", x:150, y:200, r:20, style:default2}
  ]
  paths: []}
];
emptyState = {
  circles: [],
  paths: []
};

var svgCanvas = new Vue({
  el: '#svgCanvas',
  methods: {
    zoom: function(factor) {
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
    dragStop: function(event, index) {
      this.currentTarget = undefined;
    },
    showTab: function(tab) {
      var onState = completeState[tab];
      if (!onState) {
        onState = emptyState;
      }
      this.circles = onState.circles;
    },
    lineStart: function(event) {
      console.log(event);
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

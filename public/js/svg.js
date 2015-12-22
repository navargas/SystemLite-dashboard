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
    {label:"Redis_Cache", x:190,  y:40, r:10, style:default3},
    {label:"New_Path_test", x:70,  y:230, r:10, style:default3},
    {label:"New_Path_target", x:260,  y:230, r:10, style:default1}
  ],
  paths: [
    {from: "Load_Balancer", to:"Dashboard_1"},
    {from: "Load_Balancer", to:"Dashboard_2"},
    {from: "Redis_Cache", to:"PostgreSQL"},
    {from: "Dashboard_2", to:"Redis_Cache"},
    {from: "Dashboard_1", to:"Redis_Cache"},
    {from: "Dashboard_2", to:"PostgreSQL"},
    {from: "Dashboard_1", to:"PostgreSQL"}
  ]},
  {circles: [
    {label:"Watson_API", x:50,  y:100, r:20, style:default1},
    {label:"RabittMQ", x:150, y:100, r:20, style:default2}
  ],
  paths: [
    {from: "Watson_API", to:"RabittMQ"}
  ]}
];
emptyState = {
  circles: [],
  paths: []
};

var DEFAULT_SCALE = 3;

function itemByLabel(list, label) {
  for (object in list) {
    if (list[object].label == label) return list[object];
  }
}

function constructPathProperty(start, curve1, curve2, end) {
  // example: M10,99 C156,99 231,248 400,250
  return 'M' + start[0] + ',' + start[1] + ' C'
         + curve1[0] + ',' + curve1[1] + ' '
         + curve2[0] + ',' + curve2[1] + ' '
         + end[0] + ',' + end[1]
}

function filterMousePaths(paths) {
  return paths.filter(function(value) {
    return value.to.mouse === undefined;
  });
}

function translatePaths(state, mouse) {
  // take objects containing {from, to} properties
  // and construct a formatted string
  var bezierGap = 10;
  var strPaths = [];
  for (path in state.paths) {
    if (state.paths[path].to.mouse) {
      var to = {r:0, x:mouse.x, y:mouse.y};
    } else {
      var to = itemByLabel(state.circles, state.paths[path].to);
    }
    var from = itemByLabel(state.circles, state.paths[path].from);
    var start = [from.x + from.r, from.y-1];
    var curve1 = [start[0] + bezierGap, start[1]];
    var end = [to.x - to.r, to.y-1];
    var curve2 = [end[0] - bezierGap, end[1]];
    strPaths.push(
      constructPathProperty(start, curve1, curve2, end)
    );
  }
  return strPaths;
}

var svgCanvas = new Vue({
  el: '#svgCanvas',
  methods: {
    zoom: function(factor) {
      this.scaleFactor += factor;
    },
    mouseMove: function(event) {
      var topOffset = document
                      .getElementById('svgCanvas')
                      .getBoundingClientRect()
                      .top;
      var dx = event.x/this.scaleFactor - this.mouse.x;
      var dy = event.y/this.scaleFactor - this.mouse.y - topOffset/this.scaleFactor;
      this.mouse.x = event.x/this.scaleFactor;
      this.mouse.y = event.y/this.scaleFactor - topOffset/this.scaleFactor;
      if (this.currentTarget !== undefined) {
        this.currentTarget.x += dx;
        this.currentTarget.y += dy;
      }
      this.paths = translatePaths(this.onState, this.mouse);
    },
    dragStart: function(event, index) {
      this.currentTarget = this.circles[index];
    },
    dragStop: function(event, index) {
      this.currentTarget = undefined;
      this.onState.paths.$remove(this.mousepath);
      this.paths = translatePaths(this.onState, this.mouse);
    },
    showTab: function(tab) {
      console.log('showing:', tab);
      this.onState = this.completeState[tab];
      if (!this.onState) {
        this.onState = emptyState;
      }
      this.circles = this.onState.circles;
      this.paths = translatePaths(this.onState, this.mouse);
      console.log('new circles', this.circles);
    },
    connectPath: function(itemIndex) {
      this.onState.paths.push({
        from: this.mousepath.from,
        to: this.onState.circles[itemIndex].label
      });
      this.onState.paths.$remove(this.mousepath);
      this.paths = translatePaths(this.onState, this.mouse);
    },
    lineStart: function(event, itemIndex) {
      this.mousepath =
        {from:this.onState.circles[itemIndex].label, to:{mouse:true}};
      this.onState.paths.push(this.mousepath);
    },
    setState: function(stateObject) {
      this.completeState = stateObject;
    }
  },
  data: {
    scaleFactor: 3,
    mousepath: undefined,
    scaleFactorStyle: 'scale(3)',
    mouse: {x:0, y:0},
    currentTarget: undefined,
    onState: undefined,
    completeState: completeState,
    paths: [],
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
      if (direction === 0) {
        svgCanvas.scaleFactor = DEFAULT_SCALE;
      }
      svgCanvas.zoom(direction * .4);
    }
  },
  data: {
  }
});

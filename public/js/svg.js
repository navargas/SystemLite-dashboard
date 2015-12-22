var emptyState = {
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
      var dx = event.layerX/this.scaleFactor - this.mouse.x;
      var dy = event.layerY/this.scaleFactor - this.mouse.y;
      this.mouse.x = event.layerX/this.scaleFactor;
      this.mouse.y = event.layerY/this.scaleFactor;
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
      this.onState = this.completeState[tab];
      if (!this.onState) {
        this.onState = emptyState;
      }
      this.circles = this.onState.circles;
      this.paths = translatePaths(this.onState, this.mouse);
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
    completeState: [],
    paths: [],
    circles: []
  }
});

svgCanvas.showTab(0);

document.addEventListener("switchTab", function(data) {
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

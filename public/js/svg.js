var emptyState = {
  circles: [],
  paths: []
};

var DEFAULT_SCALE = 3;

var dispatchMessage = document.createEvent('Event');
dispatchMessage.initEvent("dispatchMessage",true,true);
function send(data) {
  dispatchMessage.data = data;
  document.dispatchEvent(dispatchMessage);
}

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
  var bezierGap = 15;
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
    dragStop: function() {
      // ignore this event if there is no active target
      if (!this.currentTarget) return;
      send({
        cmd: 'move_node',
        data: {
          nodeName: this.currentTarget.label,
          tab: this.onTab,
          x: this.currentTarget.x,
          y: this.currentTarget.y
        }
      });
      this.currentTarget = undefined;
      this.onState.paths.$remove(this.mousepath);
      this.paths = translatePaths(this.onState, this.mouse);
    },
    showTab: function(tab) {
      this.onTab = tab;
      this.onState = this.completeState[tab];
      if (!this.onState) {
        this.onState = emptyState;
      }
      this.circles = this.onState.circles;
      this.paths = translatePaths(this.onState, this.mouse);
    },
    connectPath: function(itemIndex) {
      send({
        cmd: 'connect_nodes',
        data: {
          from: this.mousepath.from,
          to: this.onState.circles[itemIndex].label,
          tab: this.onTab
        }
      });
    },
    lineStart: function(event, itemIndex) {
      this.mousepath =
        {from:this.onState.circles[itemIndex].label, to:{mouse:true}};
      this.onState.paths.push(this.mousepath);
    },
    setState: function(stateObject) {
      this.completeState = stateObject;
    },
    doubleClickCanvas: function(event) {
      var defaultApplication = "navargas/demo-webapp-nodejs";
      var imagePrompt = "Enter the name of the docker container";
      var namePrompt = "Enter the name of this node";
      var pos = [
        event.layerX/this.scaleFactor,
        event.layerY/this.scaleFactor
      ];
      var imageName = prompt(imagePrompt, defaultApplication);
      var nodeName = prompt(namePrompt, "Default_1");
      if (imageName && nodeName) {
        send({
          cmd:'create_node',
          data: {imageName:imageName, position:pos, tab:this.onTab, label:nodeName}
        });
      }
    }
  },
  data: {
    onTab: 0,
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
    commitChanges: function() {
      send({"cmd":"commit_changes"});
    },
    togglePalette: function() {
      this.showPalette = !this.showPalette;
    },
    newNode: function() {
      hud.showNewItem(function() {
        console.log('Item saved');
      });
    },
    nodeClick: function(index) {
      if (index === 0) {
        this.newNode();
        return;
      }
    },
    setPalette: function(array) {
      this.nodes = array;
      this.nodes.unshift(this.defaultNode);
    },
    scaleSvgButton: function(direction) {
      if (direction === 0) {
        svgCanvas.scaleFactor = DEFAULT_SCALE;
      }
      svgCanvas.zoom(direction * .4);
    }
  },
  data: {
    showPalette: false,
    nodes: [],
    defaultNode:
      {name:'New Node', detail:'+', fill:'white', strokeColor:'grey', dash:'5,5'}
  }
});

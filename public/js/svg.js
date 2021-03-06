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
    if (!from || !to) {
      console.warn(state.paths[path].from, state.paths[path].to, 'path unfound');
      continue;
    }
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
    pathClick: function(index) {
      this.activePathIndex = index;
    },
    canvasClick: function() {
      this.activePathIndex = null;
    },
    mouseUp: function() {
      this.onState.paths.$remove(this.mousepath);
      this.mousepath = undefined;
      this.paths = translatePaths(this.onState, this.mouse);
    },
    keyPress: function(event) {
      var KeyID = event.keyCode;
      var d = event.srcElement || event.target;
      var sourceTag = d.tagName.toUpperCase();
      switch(KeyID)
      {
        case 8:
          if (sourceTag != 'BODY') break;
          event.preventDefault();
          if (this.activePathIndex !== null) {
            send({
              cmd: 'delete_path',
              data: {
                tab: this.onTab,
                pathIndex: this.activePathIndex
              }
            });
            this.activePathIndex = null;
          }
          break;
        case 46:
          if (sourceTag != 'BODY') break;
          event.preventDefault();
          if (this.activePathIndex !== null) {
            send({
              cmd: 'delete_path',
              data: {
                tab: this.onTab,
                pathIndex: this.activePathIndex
              }
            });
            this.activePathIndex = null;
          }
          break;
        default:
          break;
      }
    },
    mouseMove: function(event) {
      var topOffset = document
                      .getElementById('svgCanvas')
                      .getBoundingClientRect()
                      .top;
      var dx = event.clientX/this.scaleFactor - this.mouse.x;
      var dy = event.clientY/this.scaleFactor - this.mouse.y - topOffset/this.scaleFactor;
      this.mouse.x = event.clientX/this.scaleFactor;
      this.mouse.y = event.clientY/this.scaleFactor - topOffset/this.scaleFactor;
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
    doubleClickCircle: function(event, index) {
      var nodeName = this.circles[index].label;
      var onTab = this.onTab;
      hud.showNodeSettings(this.circles[index], {
        accept: function(data) {
          console.log('New name:', data.newName);
          send({
            cmd: 'change_node_name',
            data: {
              node: nodeName,
              newName: data.newName,
              tab: onTab
            }
          });
        },
        suspendNode: function() {
          var message = 'Are you sure you wish to suspend ' + nodeName + '?';
          hud.showConfirm(message, function() {
            send({
              cmd: 'suspend_node',
              data: {
                tab: onTab,
                index: index
              }
            });
          });
        },
        cancel: function() {

        },
        deleteNode: function() {
          var message = 'Are you sure you wish to delete ' + nodeName + '?';
          hud.showConfirm(message, function() {
            send({
              cmd: 'delete_node',
              data: {
                tab: onTab,
                index: index
              }
            });
          });
        }
      });
    }
  },
  data: {
    onTab: 0,
    scaleFactor: 3,
    activePathIndex: null,
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

document.addEventListener("keydown", svgCanvas.keyPress);

document.addEventListener("mouseup", svgCanvas.mouseUp);

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
      hud.showNewItem(function(data) {
        send({
          cmd: 'new_palette_item',
          data: data
        });
      });
    },
    stopAllContainers: function() {
      send({
        cmd: 'terminate_containers'
      });
    },
    newNetworkNode: function() {
      hud.showNetworkNode(function(data) {
        net = data.host + ':' + data.container;
        send({
          cmd:'create_node',
          data: {
            imageName: '~network',
            network: net,
            radius: 25,
            inColor: 'white',
            outColor: 'black',
            position: [100, 100],
            tab: svgCanvas.onTab,
            label: 'Network'
          }
        });
      });
    },
    nodeClick: function(index) {
      if (index === 0) {
        this.newNode();
        return;
      }
      var target = this.nodes[index];
      hud.showPaletteAction(index, target.error, {
        accept: function() {
          send({
            cmd:'create_node',
            data: {
              imageName: target.image,
              inColor: target.fill,
              outColor: target.strokeColor,
              position: [100, 100],
              tab: svgCanvas.onTab,
              env: target.env,
              label: target.name
            }
          });
        },
        deleteItem: function() {
          // offset one to account for fake item 0
          var idx = index - 1;
          send({
            cmd: 'delete_palette_item',
            data: {
              index: idx
            }
          });
        },
        modify: function() {
          // offset one to account for fake item 0
          var idx = index - 1;
          hud.showNewItem(function(data) {
            data.index = idx;
            send({
              cmd: 'edit_palette_item',
              data: data
            });
          }, target);
        }
      });
    },
    setPalette: function(array) {
      array.unshift(this.defaultNode);
      this.nodes = array;
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

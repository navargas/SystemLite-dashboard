Vue.config.debug = true;
var componentList = [];

function currentlySelectedIndex(complist) {
  // Return the index of the currently selected tab
  for (elem in complist) {
    if (complist[elem].selected) return elem;
  }
}

var switchTabEvent = document.createEvent('Event');
switchTabEvent.initEvent("switchTab",true,true);

function switchToTab(complist, index) {
  // Change currently displayed tab, accepts negative numbers
  for (elem in complist) {
    complist[elem].selected = (index == elem);
  }
  switchTabEvent.index = index;
  document.dispatchEvent(switchTabEvent);
}

function nextAvailableName(complist) {
  // return the next available New_Tab## style name
  var format = /^New_Tab([0-9]+)$/;
  var max = 0;
  for (elem in complist) {
    var regTest = format.exec(complist[elem].name);
    if (regTest) {
      max = parseInt(regTest[1]) > max ? parseInt(regTest[1]) : max;
    }
  }
  return 'New_Tab' + (max + 1);
}

function componentByName(complist, name) {
  for (elem in complist) {
    if (complist[elem].name == name) return complist[elem];
  }
}

function makeTabTitleEditable(element, componentList, index) {
  // When an active tab is clicked, the title becomes editable
  // when focus is lost of "enter" is pressed the user is prompted
  // to confirm that the name should be changed
  var stopEdit = function(elem) {
    // This function is called when the title span loses focus or
    // when"enter" is pressed
    elem.contentEditable = false;
    // Disable callbacks
    elem.onblur = function() {};
    elem.onkeypress = function() {};
    // Ensure that the text has changed
    if (elem.innerText == elem.dataset.oldName) return;
    var message = 'Are you sure you wish to change the name of \"' +
                elem.dataset.oldName + '\" to \"' + elem.innerText + '\"?';
    hud.showConfirm(message, function() {
      // yes
      send({
        cmd: 'change_tab_name',
        data: {index:index, name:elem.innerText}
      });
    }, function() {
      // no
      elem.innerText = elem.dataset.oldName;
    });
  };
  if (element.className != 'tab-name') return;
  element.onblur = function(event) {
    stopEdit(element);
  };
  element.onkeypress = function(e) {
    if (e.which == 32) return false;
    if (e.which == 13) {
      // Enter key
      stopEdit(element);
      return false;
    }
  };
  if (!element.dataset) element.dataset = {};
  element.dataset.oldName = element.innerText;
  element.contentEditable = true;
}

function activateNearbyTab(complist, nearIndex) {
  // Switch to tab to the right of nearindex if it exists
  // otherwise switch to the tab to the left of nearIndex
  var target = 0;
  if (nearIndex >= complist.length - 1) {
    target = nearIndex - 1;
  } else {
    target = nearIndex + 1;
  }
  if (target >= 0) switchToTab(complist, target);
}

var tabs = new Vue({
  el: '#components',
  methods: {
    deleteTab: function(index) {
      var message = 'Are you sure you wish to delete \"' + this.compList[index].name + '"?';
      hud.showConfirm(message, function() {
        send({cmd:'delete_tab', data:{tab:index}});
      });
      return false;
    },
    newTab: function() {
      send({
        cmd: 'create_new_tab',
        data: {name:nextAvailableName(this.compList)}
      });
    },
    tabClick: function(index, e) {
      if (index == currentlySelectedIndex(this.compList)) {
        makeTabTitleEditable(e.srcElement, this.compList, index);
      } else {
        switchToTab(this.compList, index);
      }
    },
    setTabs: function(tabData) {
      this.compList = tabData;
    }
  },
  data: {
    compList: componentList
  }
});

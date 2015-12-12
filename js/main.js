Vue.config.debug = true;
var componentList = [
  {name:"Vue", selected:true},
  {name:"is_working", selected:false},
  {name:"microservice", selected:false},
  {name:"asdasdasdasdd", selected:false},
  {name:"asdasdasdwwwww", selected:false}
];

function currentlySelectedIndex(complist) {
  // Return the index of the currently selected tab
  for (elem in complist) {
    if (complist[elem].selected) return elem;
  }
}

function switchToTab(complist, index) {
  // Change currently displayed tab, accepts negative numbers
  for (elem in complist) {
    complist[elem].selected = (index == elem);
  }
}

function nextAvailableName(complist) {
  // return the next available New_Tab## style name
  var format = /^New_Tab([0-9]+)$/;
  var max = 0;
  for (elem in complist) {
    var regTest = format.exec(complist[elem].name);
    if (regTest) {
      console.log('got', regTest[1]);
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

function makeTabTitleEditable(element) {
  // When an active tab is clicked, the title becomes editable
  // when focus is lost of "enter" is pressed the user is prompted
  // to confirm that the name should be changed
  var stopEdit = function(elem) {
    console.log('stopEdit', elem);
    // This function is called when the title span loses focus or
    // when"enter" is pressed
    elem.contentEditable = false;
    // Disable callbacks
    elem.onblur = function() {};
    elem.onkeypress = function() {};
    if (confirm('Are you sure you wish to change the name of \"' +
                elem.dataset.oldName + '\" to \"' + elem.innerText + '\"')) {
      componentByName(componentList, elem.dataset.oldName).name = elem.innerText;
    } else {
      elem.innerText = elem.dataset.oldName;
    }
  };
  if (element.className != 'tab-name') return;
  element.onblur = function(event) {
    stopEdit(element);
  };
  element.onkeypress = function(e) {
    console.log(e.which);
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
  // Switch to tab to the right of nearindex if it exist
  // otherwise switch to the tab to the left of nearIndex
  var target = 0;
  if (nearIndex >= complist.length) {
    target = nearIndex - 1;
  } else {
    target = nearIndex + 1;
  }
  if (target >= 0) switchToTab(complist, target);
}

var vm = new Vue({
  el: '#components',
  methods: {
    deleteTab: function(index) {
      if (index == currentlySelectedIndex(componentList)) {
        activateNearbyTab(componentList, index);
      }
      componentList.$remove(componentList[index]);
      return false;
    },
    newTab: function() {
      console.log('new tab');
      componentList.push(
        {name:nextAvailableName(componentList), selected:false}
      );
      switchToTab(componentList, componentList.length-1);
    },
    tabClick: function(index, e) {
      if (index == currentlySelectedIndex(componentList)) {
        makeTabTitleEditable(e.srcElement);
      } else {
        switchToTab(componentList, index);
      }
    }
  },
  data: {
    compList: componentList
  }
})

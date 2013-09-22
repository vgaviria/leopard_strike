var currentView;

currentTabURL = "";
currentport=null;
var currentView = undefined;
isGamePlaying = false;

chrome.runtime.onConnect.addListener(function(port) {
	currentport=port;
  port.onMessage.addListener(function(msg) {
		if(msg.pid && msg.x && msg.y && msg.deg){
			msg.type = PacketTypes.UPDATEPLAYER;
			socket.emit('message',msg);
		}
  });
  port.onDisconnect.addListener(function(){
	currentport=undefined;
  });
});
  
// Called when the user clicks on the browser action.
chrome.browserAction.onClicked.addListener(function(tab) {
	  var src = chrome.extension.getURL('add_canvas_auto_load.js');
	  var jq = chrome.extension.getURL('jquery-1.10.2.js');

	  // chrome.tabs.executeScript({
	  //   	code: "var s2 = document.createElement('script'); s2.src ='" + jq + "'; s2.onload = function() { var s = document.createElement('script'); s.src ='" + src + "'; (document.head||document.documentElement).appendChild(s); }; (document.head||document.documentElement).appendChild(s2);"
	  // });

	  var views = chrome.extension.getViews();
	if(currentport){
		sendJoinGame(currentTabURL);
		currentport.postMessage({init:1});
	}
	  
});

//Called when the active tab changes.
chrome.tabs.onActivated.addListener(function(activeInfo) {
	chrome.tabs.get(activeInfo.tabId, function(tab) {
		if(tab.url){
			currentTabURL = tab.url;
			sendOpenPage(currentTabURL);
		}
	});
});

chrome.tabs.onUpdated.addListener(function() {
	currentView = undefined;
});

//Called when the tab is removed
chrome.tabs.onRemoved.addListener(function(tabId,removeInfo){
	chrome.tabs.get(tabId, function(tab) {
		currentView = undefined;
	});
});
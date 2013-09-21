// Copyright (c) 2011 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
	
// Called when the user clicks on the browser action.
chrome.browserAction.onClicked.addListener(function(tab) {
	// No tabs or host permissions needed!
	  //console.log('Turning ' + tab.url + ' red!');
	  var src = chrome.extension.getURL('add_canvas_auto_load.js');
	  chrome.tabs.executeScript({
	    code: "var s = document.createElement('script'); s.src ='" + src + "'; (document.head||document.documentElement).appendChild(s);"
	  });
});
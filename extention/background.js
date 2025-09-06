chrome.browserAction.onClicked.addListener(function(tab) {
  chrome.cookies.getAll({}, function(cookies) {
    console.log(cookies);  // Logs cookies to the console
  });
});

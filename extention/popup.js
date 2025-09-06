document.addEventListener('DOMContentLoaded', function () {
  chrome.cookies.getAll({}, function(cookies) {
    const cookieListDiv = document.getElementById('cookieList');
    cookies.forEach(function(cookie) {
      const cookieElement = document.createElement('div');
      cookieElement.textContent = `Name: ${cookie.name}, Value: ${cookie.value}`;
      cookieListDiv.appendChild(cookieElement);
    });
  });
});

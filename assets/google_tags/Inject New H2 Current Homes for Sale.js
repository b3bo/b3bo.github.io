document.addEventListener('DOMContentLoaded', function() {
  console.log('Script started execution at ' + new Date().toISOString());

  function getPageTitle() {
    try {
      var path = window.location.pathname.replace(/^\/+|\/+$/g, '').split('/').pop() || 'Home';
      path = path.replace(/_/g, ' ').replace(/-/g, ' ').replace(/\b\w/g, function(l) { return l.toUpperCase(); });
      // Trim trailing " Lot", " Lots", " Condo", " Condos" from the title
      path = path.replace(/\s+(Lot|Lots|Condo|Condos)$/i, '');
      console.log('Processed title: ' + path);
      return path;
    } catch (e) {
      console.error('Error in getPageTitle: ' + e.message);
      return 'Home';
    }
  }

  function getListedCount(container) {
    try {
      var parent = container.parentElement;
      if (parent) {
        var elements = parent.getElementsByTagName('*');
        for (var i = 0; i < elements.length; i++) {
          var text = elements[i].textContent || elements[i].innerText;
          var match = text.match(/(\d+)\s*Listed/i);
          if (match) {
            console.log('Found listed count in element: ' + match[1]);
            return match[1];
          }
        }
        var parentText = parent.textContent || parent.innerText;
        var parentMatch = parentText.match(/(\d+)\s*Listed/i);
        if (parentMatch) {
          console.log('Found listed count in parent: ' + parentMatch[1]);
          return parentMatch[1];
        }
      }
      console.log('No listed count found');
      return null;
    } catch (e) {
      console.error('Error in getListedCount: ' + e.message);
      return null;
    }
  }

  try {
    console.log('Checking for container with class .si-container.si-property-stats');
    var container = document.querySelector('.si-container.si-property-stats');
    if (container) {
      var title = getPageTitle();
      var listedCount = getListedCount(container);
      // Check if the original path contains "condo" or "lot"
      var isCondosPage = /(condo|condos)/i.test(window.location.pathname);
      var isLotsPage = /(lot|lots)/i.test(window.location.pathname);
      // Pick the correct label: Condos > Lots > Homes
      var label = isCondosPage ? "Condos" : isLotsPage ? "Lots" : "Homes";
      console.log('URL: ' + window.location.pathname + ', Title: ' + title + ', Label: ' + label + ', Listed Count: ' + listedCount);
      // Build the H2 text
      var h2Text = (listedCount
        ? listedCount + " Active " + label + " for Sale in " + title
        : "Active " + label + " for Sale in " + title);
      var h2 = '<h2 id="listings">' + h2Text + '</h2>';
      container.insertAdjacentHTML('afterend', h2);
      console.log('Added H2: ' + h2Text);
    } else {
      console.log('No element with class si-container.si-property-stats found');
    }
  } catch (e) {
    console.error('Error in main script execution: ' + e.message);
  }
});
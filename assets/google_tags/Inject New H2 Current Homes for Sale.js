<script>
function getPageTitle() {
  var path = window.location.pathname.replace(/^\/+|\/+$/g, '').split('/').pop() || 'Home';
  path = path.replace(/_/g, ' ').replace(/-/g, ' ').replace(/\b\w/g, function(l) { return l.toUpperCase(); });
  return path;
}

function getListedCount(container) {
  var parent = container.parentElement;
  if (parent) {
    var elements = parent.getElementsByTagName('*');
    for (var i = 0; i < elements.length; i++) {
      var text = elements[i].textContent || elements[i].innerText;
      var match = text.match(/(\d+)\s*Listed/i);
      if (match) {
        return match[1];
      }
    }
    var parentText = parent.textContent || parent.innerText;
    var parentMatch = parentText.match(/(\d+)\s*Listed/i);
    if (parentMatch) {
      return parentMatch[1];
    }
  }
  return null;
}

var container = document.querySelector('.si-container.si-property-stats');
if (container) {
  var title = getPageTitle();
  var listedCount = getListedCount(container);
  var h2Text = (listedCount ? listedCount + ' Current Homes for Sale in ' + title : 'Current Homes for Sale in ' + title);
  var h2 = '<h2 id="listings">' + h2Text + '</h2>';
  container.insertAdjacentHTML('afterend', h2);
  console.log('Added H2: ' + h2Text);
} else {
  console.log('No element with class si-container.si-property-stats found');
}
</script>
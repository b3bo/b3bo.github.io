@echo off
echo ========================================
echo Setting up Neighborhood Map
echo ========================================
echo.

cd /d "%~dp0"

echo Creating directories...
mkdir "SierraWebsite\neighborhoods" 2>nul

echo Creating index.html...
(
echo ^<!DOCTYPE html^>
echo ^<html lang="en"^>
echo ^<head^>
echo     ^<meta charset="UTF-8"^>
echo     ^<meta name="viewport" content="width=device-width, initial-scale=1.0"^>
echo     ^<title^>Neighborhood Finder ^| Florida Emerald Coast^</title^>
echo     ^<script src="https://maps.googleapis.com/maps/api/js?key=AIzaSyDjwVlnRslcTnR8d0Ocj3zYdj4CqFkIv9E&callback=initMap"^>^</script^>
echo     ^<style^>
echo         * { margin: 0; padding: 0; box-sizing: border-box; }
echo         body { font-family: -apple-system, sans-serif; height: 100vh; }
echo         #map { width: 100%%; height: 100vh; }
echo     ^</style^>
echo ^</head^>
echo ^<body^>
echo     ^<div id="map"^>Loading...^</div^>
echo     ^<script^>
echo         function initMap^(^) {
echo             const map = new google.maps.Map^(document.getElementById^('map'^), {
echo                 zoom: 14,
echo                 center: { lat: 30.294396, lng: -86.013175 }
echo             }^);
echo             new google.maps.Marker^({
echo                 position: { lat: 30.294396, lng: -86.013175 },
echo                 map: map,
echo                 title: 'Watersound Origins'
echo             }^);
echo         }
echo         window.initMap = initMap;
echo     ^</script^>
echo ^</body^>
echo ^</html^>
) > "SierraWebsite\neighborhoods\index.html"

echo.
echo ========================================
echo Done! Files created:
echo - SierraWebsite\neighborhoods\index.html
echo ========================================
echo.
echo Next: Run deploy.bat to push to GitHub
pause

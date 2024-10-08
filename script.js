// Initialize the map
var map = L.map('map', {
    maxZoom: 18
}).setView([47.3769, 8.5417], 12);  // Centered on Zurich, Switzerland

// Add geocoder control
L.Control.geocoder().addTo(map);

// Initialize marker cluster group
var markerClusterGroup = L.markerClusterGroup({
    maxClusterRadius: 80,
    spiderfyOnMaxZoom: true,
    showCoverageOnHover: false,
    zoomToBoundsOnClick: true
});
map.addLayer(markerClusterGroup);

// Add OpenStreetMap tile layer
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

// Custom icons for police stations and fire stations using emoji
var policeIcon = L.divIcon({
    html: '👮',
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -15],
    className: 'emoji-icon police-emoji-icon'
});

var fireIcon = L.divIcon({
    html: '🚒',
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -15],
    className: 'emoji-icon fire-emoji-icon'
});

var hospitalIcon = L.divIcon({
    html: '🏥',
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -15],
    className: 'emoji-icon hospital-emoji-icon'
});

var doctorIcon = L.divIcon({
    html: '👨‍⚕️',
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -15],
    className: 'emoji-icon doctor-emoji-icon'
});

// Ensure both emoji icons have the same font size
document.documentElement.style.setProperty('--emoji-font-size', '30px');

// Function to handle pointer events
function handlePointerEvent(e) {
    if (e.pressure !== undefined) {
        console.log('Pressure:', e.pressure);
    }
    if (e.pointerType !== undefined) {
        console.log('Pointer type:', e.pointerType);
    }
}

// Add event listener for pointer events
document.addEventListener('pointerdown', handlePointerEvent);

// Function to fetch and display police stations
let markers = [];
let selectedStationType = '';
let sortByDistanceEnabled = false;

function fetchPoliceStations() {
    document.getElementById('loading').style.display = 'block';
    var overpassUrl = 'https://overpass-api.de/api/interpreter';
    var bounds = map.getBounds();
    var query = `
        [out:json][timeout:25];
        (
          node["amenity"="police"](${bounds.getSouth()},${bounds.getWest()},${bounds.getNorth()},${bounds.getEast()});
          way["amenity"="police"](${bounds.getSouth()},${bounds.getWest()},${bounds.getNorth()},${bounds.getEast()});
          relation["amenity"="police"](${bounds.getSouth()},${bounds.getWest()},${bounds.getNorth()},${bounds.getEast()});
          node["police"](${bounds.getSouth()},${bounds.getWest()},${bounds.getNorth()},${bounds.getEast()});
          way["police"](${bounds.getSouth()},${bounds.getWest()},${bounds.getNorth()},${bounds.getEast()});
          relation["police"](${bounds.getSouth()},${bounds.getWest()},${bounds.getNorth()},${bounds.getEast()});
          node["building"="police"](${bounds.getSouth()},${bounds.getWest()},${bounds.getNorth()},${bounds.getEast()});
          way["building"="police"](${bounds.getSouth()},${bounds.getWest()},${bounds.getNorth()},${bounds.getEast()});
          relation["building"="police"](${bounds.getSouth()},${bounds.getWest()},${bounds.getNorth()},${bounds.getEast()});
          node["amenity"="fire_station"](${bounds.getSouth()},${bounds.getWest()},${bounds.getNorth()},${bounds.getEast()});
          way["amenity"="fire_station"](${bounds.getSouth()},${bounds.getWest()},${bounds.getNorth()},${bounds.getEast()});
          relation["amenity"="fire_station"](${bounds.getSouth()},${bounds.getWest()},${bounds.getNorth()},${bounds.getEast()});
          node["building"="fire_station"](${bounds.getSouth()},${bounds.getWest()},${bounds.getNorth()},${bounds.getEast()});
          way["building"="fire_station"](${bounds.getSouth()},${bounds.getWest()},${bounds.getNorth()},${bounds.getEast()});
          relation["building"="fire_station"](${bounds.getSouth()},${bounds.getWest()},${bounds.getNorth()},${bounds.getEast()});
          node["amenity"="hospital"](${bounds.getSouth()},${bounds.getWest()},${bounds.getNorth()},${bounds.getEast()});
          way["amenity"="hospital"](${bounds.getSouth()},${bounds.getWest()},${bounds.getNorth()},${bounds.getEast()});
          relation["amenity"="hospital"](${bounds.getSouth()},${bounds.getWest()},${bounds.getNorth()},${bounds.getEast()});
          node["healthcare"="hospital"](${bounds.getSouth()},${bounds.getWest()},${bounds.getNorth()},${bounds.getEast()});
          way["healthcare"="hospital"](${bounds.getSouth()},${bounds.getWest()},${bounds.getNorth()},${bounds.getEast()});
          relation["healthcare"="hospital"](${bounds.getSouth()},${bounds.getWest()},${bounds.getNorth()},${bounds.getEast()});
          node["building"="hospital"](${bounds.getSouth()},${bounds.getWest()},${bounds.getNorth()},${bounds.getEast()});
          way["building"="hospital"](${bounds.getSouth()},${bounds.getWest()},${bounds.getNorth()},${bounds.getEast()});
          relation["building"="hospital"](${bounds.getSouth()},${bounds.getWest()},${bounds.getNorth()},${bounds.getEast()});
          node["amenity"="doctors"](${bounds.getSouth()},${bounds.getWest()},${bounds.getNorth()},${bounds.getEast()});
          node["amenity"="clinic"](${bounds.getSouth()},${bounds.getWest()},${bounds.getNorth()},${bounds.getEast()});
          way["amenity"="clinic"](${bounds.getSouth()},${bounds.getWest()},${bounds.getNorth()},${bounds.getEast()});
          relation["amenity"="clinic"](${bounds.getSouth()},${bounds.getWest()},${bounds.getNorth()},${bounds.getEast()});
        );
        out center;
    `;

    fetch(overpassUrl, {
        method: 'POST',
        body: 'data=' + encodeURIComponent(query)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        clearMarkers();
        const stationsList = document.getElementById('stationsList');
        stationsList.innerHTML = ''; // Clear existing list

        if (data.remark && data.remark.includes("runtime error")) {
            throw new Error(data.remark);
        }

        if (!data.elements || data.elements.length === 0) {
            console.log('No police stations found in this area');
            return;
        }

        let stations = data.elements.map(element => processStation(element));

        if (sortByDistanceEnabled) {
            stations.sort((a, b) => a.distance - b.distance);
        }

        stations.forEach(station => {
            if (!selectedStationType || station.type === selectedStationType) {
                addStationToMap(station);
                addStationToSidebar(station);
            }
        });
        document.getElementById('loading').style.display = 'none';
    })
    .catch(error => {
        console.error('Error fetching police stations:', error);
        alert('Failed to load police stations. Please try again or zoom in to a smaller area.');
        document.getElementById('loading').style.display = 'none';
    });
}

function processStation(element) {
    var type = element.tags.amenity || element.tags.healthcare || element.tags.building || element.tags.police;
    var name = element.tags.name || 
        (type === 'fire_station' ? 'Unnamed Fire Station' : 
        type === 'hospital' ? 'Unnamed Hospital' : 
        type === 'doctors' ? 'Unnamed Doctor\'s Office' :
        type === 'clinic' ? 'Unnamed Clinic' : 'Unnamed Police Station');
    var address = element.tags['addr:street'] ? `${element.tags['addr:street']} ${element.tags['addr:housenumber'] || ''}` : 'Address not available';
    
    // Use center coordinates for ways and relations
    var lat = element.lat || element.center.lat;
    var lon = element.lon || element.center.lon;
    
    var distance = calculateDistance(map.getCenter().lat, map.getCenter().lng, lat, lon);
    
    var specialities = element.tags['healthcare:speciality'] ? element.tags['healthcare:speciality'].split(';') : [];
    
    var openingHours = element.tags['opening_hours'] || 'Not available';
    var website = element.tags['website'] || 'Not available';
    var phone = element.tags['phone'] || 'Not available';
    var email = element.tags['email'] || 'Not available';
    var operator = element.tags['operator'] || 'Not available';
    var wheelchair = element.tags['wheelchair'] || 'Not specified';
    
    // Additional information for fire stations
    var fireStationType = element.tags['fire_station:type'] || 'Not specified';
    var vehicles = element.tags['vehicles'] || 'Not specified';
    
    return {
        name: name,
        address: address,
        lat: lat,
        lon: lon,
        type: type,
        distance: distance,
        specialities: specialities,
        openingHours: openingHours,
        website: website,
        phone: phone,
        email: email,
        operator: operator,
        wheelchair: wheelchair,
        fireStationType: fireStationType,
        vehicles: vehicles
    };
}

function addStationToMap(station) {
    var popupContent = `
        <b>${station.name}</b><br>
        ${station.address}<br>
        <b>Opening Hours:</b> ${station.openingHours}<br>
        <b>Website:</b> ${station.website}<br>
        <b>Phone:</b> ${station.phone}<br>
        <b>Email:</b> ${station.email}<br>
        <b>Operator:</b> ${station.operator}<br>
        <b>Wheelchair Access:</b> ${station.wheelchair}
    `;
    if (station.specialities.length > 0) {
        popupContent += `<br><b>Specialities:</b> ${station.specialities.join(', ')}`;
    }
    if (station.type === 'fire_station') {
        popupContent += `
            <br><b>Fire Station Type:</b> ${station.fireStationType}
            <br><b>Vehicles:</b> ${station.vehicles}
        `;
    }
    var icon;
    switch(station.type) {
        case 'fire_station':
            icon = fireIcon;
            break;
        case 'hospital':
        case 'clinic':
            icon = hospitalIcon;
            break;
        case 'doctors':
            icon = doctorIcon;
            break;
        case 'police':
        case 'police_post':
        case 'barracks':
            icon = policeIcon;
            break;
        default:
            console.log('Unknown station type:', station.type);
            icon = policeIcon; // Default to police icon if type is unknown
    }
    var marker = L.marker([station.lat, station.lon], {icon: icon})
        .bindPopup(popupContent);
    markerClusterGroup.addLayer(marker);
    markers.push(marker);
}

function addStationToSidebar(station) {
    const listItem = document.createElement('li');
    listItem.innerHTML = `<strong>${station.name}</strong><br>${station.address}`;
    listItem.onclick = () => {
        map.setView([station.lat, station.lon], 15);
        markers.find(m => m.getLatLng().lat === station.lat && m.getLatLng().lng === station.lon).openPopup();
    };
    document.getElementById('stationsList').appendChild(listItem);
}

function clearMarkers() {
    markerClusterGroup.clearLayers();
    markers = [];
}

function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the Earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

// Function to update map based on search
function searchLocation() {
    var location = document.getElementById('locationSearch').value;
    if (location) {
        fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}`)
            .then(response => response.json())
            .then(data => {
                if (data.length > 0) {
                    var lat = parseFloat(data[0].lat);
                    var lon = parseFloat(data[0].lon);
                    map.setView([lat, lon], 12);
                    fetchPoliceStations(lat, lon, 5000);
                } else {
                    alert('Location not found');
                }
            })
            .catch(error => {
                console.error('Error searching location:', error);
                alert('Error searching location. Please try again.');
            });
    }
}

// Event listener for search button
document.getElementById('searchButton').addEventListener('click', searchLocation);

// Add geolocation control
L.control.locate({
    position: 'topright',
    strings: {
        title: "Show me where I am"
    }
}).addTo(map);

// Event listener for map movement and zoom
map.on('moveend zoomend', function() {
    fetchPoliceStations();
});

// Event listener for station type filter
document.getElementById('stationTypeFilter').addEventListener('change', function() {
    selectedStationType = this.value;
    var center = map.getCenter();
    var radius = map.getBounds().getNorthEast().distanceTo(map.getCenter());
    fetchPoliceStations(center.lat, center.lng, radius);
});

// Event listener for sort by distance toggle
document.getElementById('sortByDistance').addEventListener('change', function() {
    sortByDistanceEnabled = this.checked;
    var center = map.getCenter();
    var radius = map.getBounds().getNorthEast().distanceTo(map.getCenter());
    fetchPoliceStations(center.lat, center.lng, radius);
});

// Initial fetch of police stations
fetchPoliceStations();

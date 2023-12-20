let currentMarker = null;
let map;
let curlnglat = [];
let searchButton = document.getElementById("searchButton");
let allMarkers = L.markerClusterGroup();
let selectMarkers = L.markerClusterGroup();
let selectJobDatas = [];

function getGeoJosn(lng, lat, callback) {
  let request = new XMLHttpRequest();

  request.open(
    "POST",
    "https://api.openrouteservice.org/v2/isochrones/driving-car"
  );

  request.setRequestHeader(
    "Accept",
    "application/json, application/geo+json, application/gpx+xml, img/png; charset=utf-8"
  );
  request.setRequestHeader("Content-Type", "application/json");
  request.setRequestHeader(
    "Authorization",
    "5b3ce3597851110001cf62481e9af151ba1e4638a650669ae6409eef"
  );

  request.onreadystatechange = function () {
    if (this.readyState === 4) {
      console.log("Status:", this.status);
      console.log("Headers:", this.getAllResponseHeaders());
      if (this.status === 200) {
        const data = JSON.parse(this.responseText);
        callback(null, data); // 回调函数返回数据
      } else {
        callback(new Error("请求失败: " + this.statusText), null);
      }
    }
  };
  const body = JSON.stringify({
    locations: [[lng, lat]],
    range: [600],
  });

  request.send(body);
}

function addMarkerLayer(datas, markers) {
  for (let index = 0; index < datas.length; index++) {
    // 提取坐标
    const lat = parseFloat(datas[index].座標[1]);
    const lng = parseFloat(datas[index].座標[0]);
    if (
      !isNaN(lat) &&
      !isNaN(lng) &&
      lat >= -90 &&
      lat <= 90 &&
      lng >= -180 &&
      lng <= 180
    ) {
      var marker = L.marker([lat, lng]);
      marker.bindPopup(
        `<strong>${datas[index]["職缺名:"]}</strong><br/>${datas[index]["公司名:"]}<br/><a href="${datas[index]["連結:"]}" target="_blank">详情</a><br/>索引: ${index}`
      );
      markers.addLayer(marker);
    } else {
      console.log(`Invalid lat/lng for job ${index}: ${lat}, ${lng}`);
    }
  }
  map.addLayer(markers);
}

document.addEventListener("DOMContentLoaded", function () {
  map = L.map("mapid").setView([25.033, 121.5654], 13);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  }).addTo(map);

  addMarkerLayer(job_datas, allMarkers);

  map.on("click", function (e) {
    if (currentMarker) {
      map.removeLayer(currentMarker);
    }

    currentMarker = L.marker(e.latlng, { draggable: true }).addTo(map);
    curlnglat[0] = e.latlng.lng;
    curlnglat[1] = e.latlng.lat;
    console.log(curlnglat);
  });

  searchButton.addEventListener("click", function () {
    getGeoJosn(curlnglat[0], curlnglat[1], (err, data) => {
      if (err) {
        console.error(err);
      } else {
        geojson = data;

        map.removeLayer(allMarkers);
        select()
        addMarkerLayer(selectJobDatas,selectMarkers);
        drawGeoJSON();
      }
    });
  });
});

job_datas.map((job_data, index) => {
  let lng = parseFloat(job_data.座標[0]);
  let lat = parseFloat(job_data.座標[1]);

  try {
    if (
      !isNaN(lat) &&
      !isNaN(lng) &&
      lat >= -90 &&
      lat <= 90 &&
      lng >= -180 &&
      lng <= 180
    ) {
      if (checkPointsInGeoJSON(geojson, [[lng, lat]])[0]) {
        selectJobDatas.push(job_data);
      }
    }
  } catch (error) {
    console.log(error);
  }
});

function drawGeoJSON() {
  L.geoJSON(geojson, {
    style: (feature) => {
      return {
        stroke: true,
        color: "#9933ff",
        weight: 2,
        opacity: 0.7,
        fill: true,
        fillColor: "#333399",
        fillOpacity: 0.15,
        smoothFactor: 0.5,
        interactive: false,
      };
    },
  }).addTo(map);
}

function checkPointsInGeoJSON(geojson, points) {
  geojson = geojson.features[0];

  // 确保GeoJSON是一个多边形
  if (geojson.type !== "Feature" || geojson.geometry.type !== "Polygon") {
    console.error("GeoJSON不是有效的多边形");
    return;
  }

  const pointsInPolygon = points.filter((point) => {
    // 创建一个点
    const pt = turf.point([point[0], point[1]]);
    // 检查点是否在多边形内
    return turf.booleanPointInPolygon(pt, geojson);
  });

  return pointsInPolygon;
}

function select() {
  job_datas.map((job_data, index) => {
    let lng = parseFloat(job_data.座標[0]);
    let lat = parseFloat(job_data.座標[1]);

    try {
      if (
        !isNaN(lat) &&
        !isNaN(lng) &&
        lat >= -90 &&
        lat <= 90 &&
        lng >= -180 &&
        lng <= 180
      ) {
        if (checkPointsInGeoJSON(geojson, [[lng, lat]])[0]) {
          selectJobDatas.push(job_data);
        }
      }
    } catch (error) {
      console.log(error);
    }
  });
}

console.log("select", selectJobDatas);

const pointsInside = checkPointsInGeoJSON(geojson, [
  [121.45351627841593, 25.03620505923356],
  [121.44163593649867, 25.034974617415553],
]);
console.log("在多边形内的点:", pointsInside);

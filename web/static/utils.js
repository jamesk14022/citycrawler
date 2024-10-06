function containsObject(obj, list) {
  var i;
  for (i = 0; i < list.length; i++) {
    if (list[i] === obj) {
      return true;
    }
  }

  return false;
}

function copy(text) {
  return new Promise((resolve, reject) => {
    if (
      typeof navigator !== "undefined" &&
      typeof navigator.clipboard !== "undefined" &&
      navigator.permissions !== "undefined"
    ) {
      const type = "text/plain";
      const blob = new Blob([text], { type });
      const data = [new ClipboardItem({ [type]: blob })];
      navigator.permissions
        .query({ name: "clipboard-write" })
        .then((permission) => {
          if (permission.state === "granted" || permission.state === "prompt") {
            navigator.clipboard.write(data).then(resolve, reject).catch(reject);
          } else {
            reject(new Error("Permission not granted!"));
          }
        });
    } else if (
      document.queryCommandSupported &&
      document.queryCommandSupported("copy")
    ) {
      var textarea = document.createElement("textarea");
      textarea.textContent = text;
      textarea.style.position = "fixed";
      textarea.style.width = "2em";
      textarea.style.height = "2em";
      textarea.style.padding = 0;
      textarea.style.border = "none";
      textarea.style.outline = "none";
      textarea.style.boxShadow = "none";
      textarea.style.background = "transparent";
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      try {
        document.execCommand("copy");
        document.body.removeChild(textarea);
        resolve();
      } catch (e) {
        document.body.removeChild(textarea);
        reject(e);
      }
    } else {
      reject(
        new Error("None of copying methods are supported by this browser!"),
      );
    }
  });
}

function updateURL(location, targetPubs, targetAttractions, ...markers) {
  var state = {
    location: location,
    targetN: targetPubs + targetAttractions,
  };
  for (let i = 0; i < markers.length; i++) {
    state[`marker${i + 1}`] = markers[i];
  }

  var pathState = `?location=${location}&target_pubs=${targetPubs}&target_attractions=${targetAttractions}`;
  for (let i = 0; i < markers.length; i++) {
    pathState += `&marker${i + 1}=${markers[i]}`;
  }

  history.pushState(state, "Route", pathState);
}

function convertToGeoJSON(dataArray) {
  return {
    type: "geojson",
    data: {
      type: "FeatureCollection",
      features: dataArray.map((item) => ({
        type: "Feature",
        properties: {
          name: item.name,
          place_id: item.place_id,
          price_level: item.price_level,
          rating: item.rating,
        },
        geometry: {
          type: "Point",
          coordinates: [item.Geometry.Location.lng, item.Geometry.Location.lat],
        },
      })),
    },
  };
}

export { containsObject, copy, updateURL, convertToGeoJSON };

// The browser's own location lookup as a promise of { lat, lng }. Browsers allow it only on HTTPS (and localhost).
// Rejects with a message that can go straight into a toast.
export const getCurrentPoint = () =>
  new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("This browser can't share your location. Enter your pincode instead."));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => resolve({ lat: Number(coords.latitude.toFixed(6)), lng: Number(coords.longitude.toFixed(6)) }),
      (error) =>
        reject(new Error(error.code === error.PERMISSION_DENIED
          ? "Location access is blocked. Allow it in your browser settings, or enter your pincode."
          : "Couldn't get your location. Enter your pincode instead.")),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  });

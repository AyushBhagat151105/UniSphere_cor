import * as ExpoCamera from "expo-camera";
import * as ExpoImage from "expo-image";
import * as ExpoImagePicker from "expo-image-picker";
import * as ExpoSharing from "expo-sharing";

// Central import surface for the optional Expo modules selected at scaffold time.
// Import the relevant namespace from this object when wiring app-specific permissions and flows.
export const mobileLibraries = {
  ExpoCamera,
  ExpoImagePicker,
  ExpoImage,
  ExpoSharing,
} as const;

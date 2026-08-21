export type FlowStep = 'distance' | 'arrival' | 'camera' | 'loading';
export type CaptureMode = 'free' | 'overlay' | 'original';
export type CapturedPhoto = {
  height: number;
  uri: string;
  width: number;
};
export type AdventureLocationStatus =
  'no-destination' | 'checking' | 'permission-needed' | 'locating' | 'ready' | 'error';
export type Coordinates = {
  latitude: number;
  longitude: number;
};
export type AdventureDestination = {
  coordinates: Coordinates;
  name: string;
};

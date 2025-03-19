export interface AsteroidData {
  id: string;
  name: string;
  distance: number;
  composition: {
    [key: string]: number;
  };
  model_url: string;
}

export interface MiningResult {
  yield: {
    [mineral: string]: number;
  };
  gold_found: boolean;
  energy_remaining: number;
}

export interface UserState {
  energy: number;
  minerals: {
    [mineral: string]: number;
  };
  credits: number;
} 
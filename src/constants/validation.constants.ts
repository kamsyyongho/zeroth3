export const VALIDATION = {
  PROJECT: {
    threshold: {
      min: 1,
      max: 100,
    },
    name: {
      min: 3,
      max: 50,
    },
  },
  MODELS: {
    ACOUSTIC: {
      name: {
        min: 2,
        max: 50,
      },
      sampleRate: {
        min: 8,
        max: 64,
      },
      description: {
        max: 250,
      },
    },
  },
  TDP: {
    length: {
      min: 0,
    },
    score: {
      min: 0,
      max: 100,
    },
  },
};

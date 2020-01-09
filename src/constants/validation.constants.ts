export const VALIDATION = {
  PROJECT: {
    threshold: {
      moreThan: 0,
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
      /** kHz */
      sampleRates: [8, 16],
      sampleRate: {
        min: 8,
        max: 16,
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
  },
  SET: {
    name: {
      min: 3,
      max: 50,
    },
  },
  ORGANIZATION: {
    name: {
      min: 2,
      max: 50,
    },
  },
  EDITOR: {
    freeText: {
      min: 0,
      max: 255,
    },
  },
};

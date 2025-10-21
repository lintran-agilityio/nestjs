export const VALIDATION_RULES = {
  PASSWORD: {
    MAX: 20,
    MIN: 6,
  },

  FIRST_NAME: {
    MAX: 20,
    MIN: 1,
  },

  LAST_NAME: {
    MAX: 20,
    MIN: 1,
  },

  PAGINATION: {
    CURRENT_PAGE: 1,
    ITEMS_PER_PAGE: {
      DEFAULT: 10,
      MIN: 1,
      MAX: 10,
    },
  },
};

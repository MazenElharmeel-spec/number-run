(() => {
  /** Create a lightweight pseudo-random stream with fresh entropy for each run. */
  function createRandom() {
    let state = (crypto.getRandomValues(new Uint32Array(1))[0] ^ Date.now()) >>> 0;

    return function random() {
      state = (state + 0x6d2b79f5) | 0;

      let value = Math.imul(state ^ (state >>> 15), 1 | state);
      value ^= value + Math.imul(value ^ (value >>> 7), 61 | value);

      return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
    };
  }

  /** Return an integer in the inclusive range [minimum, maximum]. */
  function randomInteger(random, minimum, maximum) {
    return Math.floor(random() * (maximum - minimum + 1)) + minimum;
  }

  window.NumberRunRandom = { createRandom, randomInteger };
})();

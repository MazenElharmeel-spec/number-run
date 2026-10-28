(() => {
  /**
   * Build the next math problem and its three answer choices.
   * The stage increases once for every new gate.
   */
  function createEquation(random, stage) {
    const operations = getAvailableOperations(stage);
    const operation = operations[randomInteger(random, 0, operations.length - 1)];
    const operands = createOperands(random, operation, stage);
    const { left, right, symbol, answer } = operands;

    const choices = [
      {
        answer,
        correct: true,
      },
    ];

    addWrongAnswers(random, choices, answer);
    shuffle(random, choices);

    return {
      problem: `${left} ${symbol} ${right}`,
      choices,
      solution: `${left}${symbol}${right}=${answer}`,
    };
  }

  function getAvailableOperations(stage) {
    if (stage < 2) return ["+", "−"];
    if (stage < 5) return ["+", "−", "×"];
    return ["+", "−", "×", "÷"];
  }

  function createOperands(random, operation, stage) {
    const maximum = 12 + Math.min(90, stage * 3);

    if (operation === "+") {
      const left = randomInteger(random, 8, maximum);
      const right = randomInteger(random, 3, maximum);

      return { left, right, symbol: "+", answer: left + right };
    }

    if (operation === "−") {
      const left = randomInteger(random, 3, maximum);
      const right = randomInteger(random, 2, left - 1);

      return { left, right, symbol: "−", answer: left - right };
    }

    if (operation === "×") {
      const left = randomInteger(random, 2, Math.min(12, 3 + Math.floor(stage / 2)));
      const right = randomInteger(random, 2, Math.min(10, 3 + Math.floor(stage / 3)));

      return { left, right, symbol: "×", answer: left * right };
    }

    const divisor = randomInteger(random, 2, Math.min(12, 3 + Math.floor(stage / 3)));
    const quotient = randomInteger(random, 2, Math.min(20, 4 + Math.floor(stage / 2)));

    return {
      left: divisor * quotient,
      right: divisor,
      symbol: "÷",
      answer: quotient,
    };
  }

  function addWrongAnswers(random, choices, correctAnswer) {
    while (choices.length < 3) {
      const maximumOffset = Math.max(3, Math.min(19, Math.floor(correctAnswer * 0.18) + 2));
      const offset = randomInteger(random, 1, maximumOffset);
      const subtractOffset = correctAnswer > offset && random() < 0.45;
      const answer = subtractOffset ? correctAnswer - offset : correctAnswer + offset;

      if (!choices.some((choice) => choice.answer === answer)) {
        choices.push({ answer, correct: false });
      }
    }
  }

  function shuffle(random, items) {
    for (let index = items.length - 1; index > 0; index -= 1) {
      const swapIndex = randomInteger(random, 0, index);
      [items[index], items[swapIndex]] = [items[swapIndex], items[index]];
    }
  }

  const { randomInteger } = window.NumberRunRandom;
  window.NumberRunEquations = { createEquation };
})();

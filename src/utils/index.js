export function generateRandomTextArray(numObjects) {
  const generateRandomText = () => {
    const length = Math.floor(Math.random() * 100) + 20; // Random text length between 20 and 120
    return Array.from({ length }, () =>
      String.fromCharCode(Math.floor(Math.random() * 26) + 97)
    ).join("");
  };

  const textArray = Array.from({ length: numObjects }, (_, index) => ({
    text: generateRandomText(),
    timestamp: index + 1,
  }));

  return textArray;
}

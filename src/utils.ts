export const random = (min: number, max: number) => {
  return Math.random() * (max - min) + min;
}

export const getEuclidianDistnace = (deltaX: number, deltaZ: number) => {
    return Math.sqrt(deltaX ** 2 + deltaZ ** 2);
}
function Star({ radius, x, y, twinkleDuration }) {
  return (
    <div
      className="star"
      style={{
        "--radius": radius,
        "--x": x,
        "--y": y,
        // "--travel-duration": travelDuration,
        "--twinkle-duration": twinkleDuration,
      }}
    />
  );
}

export default Star;

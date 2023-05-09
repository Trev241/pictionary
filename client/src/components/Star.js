function Star({ radius, x, y, twinkleDuration, lowestOpacity }) {
  return (
    <div
      className="star"
      style={{
        "--radius": radius,
        "--x": x,
        "--y": y,
        // "--travel-duration": travelDuration,
        "--twinkle-duration": twinkleDuration,
        "--lowest-opacity": lowestOpacity,
      }}
    />
  );
}

export default Star;

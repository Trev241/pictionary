import Star from "./Star";
import "./Sky.css";
import { memo } from "react";

function Sky({ starCount }) {
  if (!starCount) starCount = 300;

  const stars = [];
  for (let i = 0; i < starCount; i++) {
    const radius = Math.random() * 0.25;
    const x = Math.floor(Math.random() * (95 - 5) + 5);
    const y = Math.floor(Math.random() * (85 - 5) + 5);
    const twinkleDuration = Math.random() * (3.5 - 0.5) + 0.5;
    const lowestOpacity = Math.random() * 1;

    stars.push(
      <Star
        radius={radius + "rem"}
        x={x + "%"}
        y={y + "%"}
        twinkleDuration={twinkleDuration + "s"}
        lowestOpacity={lowestOpacity}
      />
    );
  }

  return <>{stars}</>;
}

export default memo(Sky);

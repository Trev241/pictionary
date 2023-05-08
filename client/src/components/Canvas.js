import { useCallback, useEffect, useRef } from "react";
import useFabric from "../hooks/useFabric";
import { useWebSocket } from "react-use-websocket/dist/lib/use-websocket";
import { MdClear } from "react-icons/md";

function Canvas({ aspectRatio, enabled }) {
  const canvasRef = useRef(null);
  const { sendJsonMessage } = useWebSocket("ws://localhost:8080", {
    share: true,
  });

  const colors = {
    "bg-black": "#000000",
    "bg-yellow-300": "#FDE047",
    "bg-red-600": "#DC2626",
    "bg-rose-500": "#F43F5E",
    "bg-blue-500": "#3B82F6",
    "bg-blue-950": "#172554",
    "bg-green-600": "#16A34A",
    "bg-violet-700": "#6D28D9",
    "bg-white": "#FFFFFF",
    "bg-orange-500": "#F97316",
    "bg-orange-800": "#9A3412",
    "bg-gray-500": "#6B7280",
    "bg-gray-800": "#1F2937",
    "bg-lime-600": "#65A30D",
    "bg-green-800": "#166534",
    "bg-pink-400": "#F472B6",
  };

  if (!aspectRatio) aspectRatio = 16.0 / 9.0;

  const ref = useFabric(
    useCallback(
      (fabricCanvas) => {
        const containerWidth =
          document.getElementById("canvas-container").offsetWidth;
        fabricCanvas.setWidth(containerWidth);
        fabricCanvas.setHeight(containerWidth / aspectRatio);

        fabricCanvas.backgroundColor = "white";
        fabricCanvas.isDrawingMode = true;
        fabricCanvas.freeDrawingBrush.width = 10;
        fabricCanvas.on("mouse:up", () =>
          sendJsonMessage({
            type: "CANVAS_UPDATE",
            canvas: fabricCanvas.toDatalessJSON(),
          })
        );
        canvasRef.current = fabricCanvas;
      },
      [sendJsonMessage]
    )
  );

  // Register listener
  useEffect(() => {
    const resizeCanvas = () => {
      const newWidth = document.getElementById("canvas-container").offsetWidth;

      if (canvasRef.current && canvasRef.current.width !== newWidth) {
        const scaleMultiplier = newWidth / canvasRef.current.width;
        const objects = canvasRef.current.getObjects();
        for (const i in objects) {
          objects[i].scaleX = objects[i].scaleX * scaleMultiplier;
          objects[i].scaleY = objects[i].scaleY * scaleMultiplier;
          objects[i].left = objects[i].left * scaleMultiplier;
          objects[i].top = objects[i].top * scaleMultiplier;
          objects[i].setCoords();
        }

        const obj = canvasRef.backgroundImage;
        if (obj) {
          obj.scaleX = obj.scaleX * scaleMultiplier;
          obj.scaleY = obj.scaleY * scaleMultiplier;
        }

        canvasRef.current.discardActiveObject();
        canvasRef.current.setWidth(
          canvasRef.current.getWidth() * scaleMultiplier
        );
        canvasRef.current.setHeight(
          canvasRef.current.getHeight() * scaleMultiplier
        );
        canvasRef.current.renderAll();
        canvasRef.current.calcOffset();
      }
    };

    window.addEventListener("resize", resizeCanvas);

    return () => window.removeEventListener("resize", resizeCanvas);
  }, []);

  return (
    <div>
      <div id="canvas-container" className="">
        <canvas ref={ref} className="border border-gray-500 rounded-2xl" />
      </div>

      <div className={`${!enabled && "invisibl"}`}>
        <div className="mt-6 font-semibold">
          Slide to adjust brush width
          <input
            className="dark:bg-gray-800"
            type="range"
            min="5"
            max="100"
            defaultValue="10"
            onChange={(e) =>
              (canvasRef.current.freeDrawingBrush.width = parseFloat(
                e.target.value
              ))
            }
          />
        </div>
        <div className="flex flex-wrap align-middle w-full justify-between">
          <div className="flex flex-col">
            <div className="flex justify-evenly">
              {Object.keys(colors)
                .slice(0, 8)
                .map((tailwindClass) => (
                  <button
                    className={`w-8 h-8 m-1 rounded border border-gray-500 ${tailwindClass}`}
                    onClick={() =>
                      (canvasRef.current.freeDrawingBrush.color =
                        colors[tailwindClass])
                    }
                  />
                ))}
            </div>
            <div className="flex justify-evenly">
              {Object.keys(colors)
                .slice(8)
                .map((tailwindClass) => (
                  <button
                    className={`w-8 h-8 m-1 rounded border border-gray-500 ${tailwindClass}`}
                    onClick={() =>
                      (canvasRef.current.freeDrawingBrush.color =
                        colors[tailwindClass])
                    }
                  />
                ))}
            </div>
            <div className="flex items-center font-semibold">
              Click
              <input
                type="color"
                className="mx-2 dark:bg-gray-800"
                onChange={(e) =>
                  (canvasRef.current.freeDrawingBrush.color = e.target.value)
                }
              />
              to select from more colors
            </div>
          </div>
          <button
            className="bg-red-600 hover:bg-red-800 p-2 px-2 rounded text-white"
            onClick={() => sendJsonMessage({ type: "CANVAS_CLEAR" })}
          >
            <MdClear className="text-6xl" />
            Clear
          </button>
        </div>
      </div>
    </div>
  );
}

export default Canvas;

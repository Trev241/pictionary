import { useCallback, useEffect, useRef } from "react";
import useFabric from "../hooks/useFabric";
import { useWebSocket } from "react-use-websocket/dist/lib/use-websocket";
import { MdClear } from "react-icons/md";
import { fabric } from "fabric";

function Canvas({ aspectRatio, enabled }) {
  const canvasRef = useRef(null);
  const { lastJsonMessage, sendJsonMessage } = useWebSocket(
    "ws://localhost:8080",
    {
      share: true,
    }
  );

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
  if (canvasRef.current) canvasRef.current.isDrawingMode = enabled;

  const ref = useFabric(
    useCallback(
      (fabricCanvas) => {
        fabric.Object.prototype.selectable = false;
        fabric.Object.prototype.hoverCursor = "default";

        const containerWidth =
          document.getElementById("canvas-container").offsetWidth;
        fabricCanvas.setWidth(containerWidth);
        fabricCanvas.setHeight(containerWidth / aspectRatio);

        fabricCanvas.backgroundColor = "white";
        fabricCanvas.isDrawingMode = enabled;
        fabricCanvas.freeDrawingBrush.width = 10;
        fabricCanvas.selection = false;
        fabricCanvas.on("mouse:up", () =>
          sendJsonMessage({
            type: "CANVAS_UPDATE",
            canvas: fabricCanvas.toDatalessJSON(),
          })
        );
        canvasRef.current = fabricCanvas;
      },
      [sendJsonMessage, aspectRatio, enabled]
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

  // Listen for canvas events
  useEffect(() => {
    if (!canvasRef || !lastJsonMessage) return;

    switch (lastJsonMessage.type) {
      case "CANVAS_UPDATE":
        canvasRef.current.loadFromJSON(lastJsonMessage.canvas);
        break;
      case "CANVAS_CLEAR":
        canvasRef.current.clear();
        canvasRef.current.backgroundColor = "white";
        break;
      default:
        console.warn(`Received unknown message type ${lastJsonMessage.type}`);
        break;
    }
  }, [lastJsonMessage, canvasRef]);

  return (
    <div className="bg-amber-100 dark:bg-gray-900 p-4 rounded-b-2xl shadow-lg">
      <div id="canvas-container" className="mb-2">
        <canvas ref={ref} className="border border-gray-500 rounded-2xl" />
      </div>

      <div
        className={`flex flex-wrap justify-evenly ${!enabled && "invisible"}`}
      >
        <div className="w-96 me-4">
          <div className="flex flex-wrap mb-2">
            {Object.keys(colors).map((className, idx) => (
              <button
                className={`rounded p-5 border border-gray-600 dark:border-gray-900 hover:rounded-xl ${className}`}
                onClick={() =>
                  (canvasRef.current.freeDrawingBrush.color = colors[className])
                }
              />
            ))}
          </div>
        </div>
        <div className="flex flex-grow items-center mb-2 p-6 dark:bg-gray-800 rounded-xl me-4">
          <div>Brush Width</div>
          <input
            className="bg-transparent dark:bg-gray-800"
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
        <button
          className="bg-red-600 hover:bg-red-800 p-2 rounded-xl text-white mb-2"
          onClick={() => sendJsonMessage({ type: "CANVAS_CLEAR" })}
        >
          <MdClear className="text-6xl" />
        </button>
      </div>
    </div>
  );
}

export default Canvas;

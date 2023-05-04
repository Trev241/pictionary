import { useCallback, useRef } from "react"
import { fabric } from "fabric";

function useFabric(onChange) {
  const fabricRef = useRef(null);
  const disposeRef = useRef(null);

  return useCallback((node) => {
    if (node) {
      fabricRef.current = new fabric.Canvas(node);
      if (onChange)
        disposeRef.current = onChange(fabricRef.current);
    } else if (fabricRef.current) {
      fabricRef.current.dispose();
      if (disposeRef.current) {
        disposeRef.current();
        disposeRef.current = undefined;
      }
    }
  }, [onChange])
}

export default useFabric
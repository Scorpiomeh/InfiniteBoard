import { useState, useRef, useEffect, useCallback } from 'react';

export const useCanvas = (stageRef) => {
  const [stageConfig, setStageConfig] = useState({
    scale: 1,
    x: 0,
    y: 0,
  });
  const [isPanning, setIsPanning] = useState(false);
  const isSpacePressed = useRef(false);
  const lastPointerPosition = useRef({ x: 0, y: 0 });

  const handleWheel = useCallback((e) => {
    e.evt.preventDefault();

    const scaleBy = 1.1;
    const stage = stageRef.current;
    if (!stage) return;

    const oldScale = stage.scaleX();

    const pointer = stage.getPointerPosition();

    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };

    const newScale = e.evt.deltaY < 0 ? oldScale * scaleBy : oldScale / scaleBy;

    const newPos = {
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    };

    setStageConfig({
      x: newPos.x,
      y: newPos.y,
      scale: newScale,
    });
  }, [stageRef]);

  const handleMouseDown = useCallback((e) => {
    if (isSpacePressed.current) {
      setIsPanning(true);
      lastPointerPosition.current = { x: e.evt.clientX, y: e.evt.clientY };
      e.evt.preventDefault();
    }
  }, []);

  const handleMouseMove = useCallback((e) => {
    if (isPanning) {
      const dx = e.evt.clientX - lastPointerPosition.current.x;
      const dy = e.evt.clientY - lastPointerPosition.current.y;

      setStageConfig((prevConfig) => ({
        ...prevConfig,
        x: prevConfig.x + dx,
        y: prevConfig.y + dy,
      }));

      lastPointerPosition.current = { x: e.evt.clientX, y: e.evt.clientY };
    }
  }, [isPanning]);

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsPanning(false);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Space') {
        isSpacePressed.current = true;
        if (!isPanning) {
          document.body.style.cursor = 'grab';
        }
      }
    };

    const handleKeyUp = (e) => {
      if (e.code === 'Space') {
        isSpacePressed.current = false;
        document.body.style.cursor = 'default';
        setIsPanning(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isPanning]);

  return {
    stageConfig,
    isPanning,
    isSpacePressed,
    handleWheel,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleMouseLeave,
  };
};

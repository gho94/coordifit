import React, { useEffect, useMemo, useRef } from "react";
import styles from "./CanvasItem.module.css";
import useImage from "use-image";
import { Image, Transformer } from "react-konva";

const CanvasItem = ({ obj, isSelected, onSelect, onChange, onLoad }) => {
  const bustRef = useRef(Date.now());

  const stableSrc = useMemo(() => {
    const url = new URL(obj.imageUrl);
    url.searchParams.set("v", bustRef.current);
    return url.toString();
  }, [obj.imageUrl]);

  const [image, status] = useImage(stableSrc, "anonymous");
  const shapeRef = useRef(null);
  const trRef = useRef(null);
  const MIN_SIZE = 10;

  useEffect(() => {
    if (onLoad) {
      onLoad(obj.clothesId, status);
    }
  }, [status]);

  useEffect(() => {
    if (isSelected && trRef.current && shapeRef.current && status === "loaded") {
      trRef.current.nodes([shapeRef.current]);
      trRef.current.getLayer().batchDraw();
      trRef.current.moveToTop();
      trRef.current.getLayer().batchDraw();
    }
  }, [isSelected, status]);

  const handleSelect = () => {
    if (shapeRef.current) {
      shapeRef.current.moveToTop();
      shapeRef.current.getLayer().batchDraw();
    }

    onSelect(obj.id);
  };

  if (!image && status === "loaded") {
    console.error("image 없음");
    return null;
  }

  const handleObjectChange = () => {
    if (!isSelected) return;

    const node = shapeRef.current;

    const scaleX = node.scaleX();
    const scaleY = node.scaleY();

    const newAttrs = {
      ...obj,
      x: node.x(),
      y: node.y(),
      width: node.width() * scaleX,
      height: node.height() * scaleY,
      rotation: node.rotation(),
      scaleX: 1,
      scaleY: 1,
    };

    node.scaleX(1);
    node.scaleY(1);

    onChange(newAttrs);
  };

  return (
    <>
      <Image
        ref={shapeRef}
        image={image}
        x={obj.x}
        y={obj.y}
        scaleX={obj.scaleX}
        scaleY={obj.scaleY}
        width={obj.width}
        height={obj.height}
        rotation={obj.rotation}
        draggable={isSelected}
        onClick={handleSelect}
        onTap={handleSelect}
        onDragEnd={handleObjectChange}
        onTransformEnd={handleObjectChange}
      />
      {isSelected && (
        <Transformer
          ref={trRef}
          rotateEnabled
          keepRatio={false}
          boundBoxFunc={(oldBox, newBox) => {
            if (newBox.width < MIN_SIZE || newBox.height < MIN_SIZE) return oldBox;
            return newBox;
          }}
        />
      )}
    </>
  );
};

export default CanvasItem;

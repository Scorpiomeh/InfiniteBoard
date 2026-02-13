export const SHAPE_TYPES = {
  RECT: 'rect',
  CIRCLE: 'circle',
  TEXT: 'text',
  DIAMOND: 'diamond',
  TRIANGLE: 'triangle',
  ARROW: 'arrow',
  STAR: 'star',
};

export const DEFAULT_SHAPE_PROPS = {
  stroke: '#333',
  strokeWidth: 2,
  draggable: true,
};

export const createShapeId = (type, counter) => `${type}${counter}`;

export const getShapeBounds = (shape) => {
  const { type } = shape;
  let left, right, top, bottom;

  switch (type) {
    case SHAPE_TYPES.RECT:
    case SHAPE_TYPES.DIAMOND:
    case SHAPE_TYPES.ARROW:
      left = shape.x - shape.width / 2;
      right = shape.x + shape.width / 2;
      top = shape.y - shape.height / 2;
      bottom = shape.y + shape.height / 2;
      break;
    case SHAPE_TYPES.CIRCLE:
    case SHAPE_TYPES.TRIANGLE:
    case SHAPE_TYPES.STAR: {
      const radius = shape.radius;
      left = shape.x - radius;
      right = shape.x + radius;
      top = shape.y - radius;
      bottom = shape.y + radius;
      break;
    }
    case SHAPE_TYPES.TEXT:
      left = shape.x;
      right = shape.x + (shape.width || 100);
      top = shape.y;
      bottom = shape.y + (shape.height || 30);
      break;
    default:
      left = shape.x;
      right = shape.x + 100;
      top = shape.y;
      bottom = shape.y + 100;
  }

  return { left, right, top, bottom };
};

export const checkOverlap = (x, y, width, height, shapes, excludeId = null) => {
  const padding = 20;

  for (const shape of shapes) {
    if (shape.id === excludeId) continue;

    const { left, right, top, bottom } = getShapeBounds(shape);

    const newLeft = x - width / 2;
    const newRight = x + width / 2;
    const newTop = y - height / 2;
    const newBottom = y + height / 2;

    if (
      newLeft < right + padding &&
      newRight > left - padding &&
      newTop < bottom + padding &&
      newBottom > top - padding
    ) {
      return true;
    }
  }
  return false;
};

export const findNonOverlappingPosition = (centerX, centerY, width, height, shapes) => {
  let x = centerX;
  let y = centerY;
  let offset = 0;
  let angle = 0;

  while (checkOverlap(x, y, width, height, shapes)) {
    offset += 30;
    angle += Math.PI / 4;
    x = centerX + offset * Math.cos(angle);
    y = centerY + offset * Math.sin(angle);

    if (offset > 500) break;
  }

  return { x, y };
};

export const createShape = (type, x, y, counter) => {
  const baseShape = {
    id: createShapeId(type, counter),
    type,
    x,
    y,
    ...DEFAULT_SHAPE_PROPS,
  };

  switch (type) {
    case SHAPE_TYPES.RECT:
      return { ...baseShape, width: 100, height: 100 };
    case SHAPE_TYPES.CIRCLE:
      return { ...baseShape, radius: 50 };
    case SHAPE_TYPES.TEXT:
      return {
        ...baseShape,
        text: '双击编辑文本',
        fontSize: 16,
        fill: '#333',
        width: 150,
        stroke: undefined,
        strokeWidth: undefined,
      };
    case SHAPE_TYPES.DIAMOND:
      return { ...baseShape, width: 100, height: 100 };
    case SHAPE_TYPES.TRIANGLE:
      return { ...baseShape, radius: 60, sides: 3 };
    case SHAPE_TYPES.ARROW:
      return { ...baseShape, width: 120, height: 60 };
    case SHAPE_TYPES.STAR:
      return {
        ...baseShape,
        radius: 60,
        numPoints: 5,
        innerRadius: 30,
        outerRadius: 60,
      };
    default:
      return baseShape;
  }
};

export const getShapeDimensions = (type) => {
  switch (type) {
    case SHAPE_TYPES.RECT:
    case SHAPE_TYPES.DIAMOND:
      return { width: 100, height: 100 };
    case SHAPE_TYPES.CIRCLE:
      return { width: 100, height: 100 };
    case SHAPE_TYPES.TEXT:
      return { width: 150, height: 30 };
    case SHAPE_TYPES.TRIANGLE:
    case SHAPE_TYPES.STAR:
      return { width: 120, height: 120 };
    case SHAPE_TYPES.ARROW:
      return { width: 120, height: 60 };
    default:
      return { width: 100, height: 100 };
  }
};

export const getDiamondPoints = (width, height) => [
  0, -height / 2,
  width / 2, 0,
  0, height / 2,
  -width / 2, 0,
];

export const getArrowPoints = (width, height) => [
  -width / 2, -height / 4,
  width / 4, -height / 4,
  width / 4, -height / 2,
  width / 2, 0,
  width / 4, height / 2,
  width / 4, height / 4,
  -width / 2, height / 4,
];

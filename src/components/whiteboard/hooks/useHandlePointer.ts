import { Ref } from "vue";
import { OPTION_TYPE } from "../config";
import { ICanvasConfig, IElement, IPenElement, IPoint } from "../types";
import {
    checkCrossElements,
    getBoundsCoordsFromPoints,
    getCanvasPointPosition,
    getPositionElement,
    getVisibleElements,
    getWhiteBoardPointPosition,
    throttleRAF
} from "../utils";
import useCreateElement from "./useCreateElement";
import useRenderElement from "./useRenderElement";
import useUpdateElement from "./useUpdateElement";

export default (
    canvas: Ref<HTMLCanvasElement | null>,
    context: Ref<CanvasRenderingContext2D | null>,
    elements: Ref<IElement[]>,
    canvasConfig: ICanvasConfig
) => {
    const { createPenElement } = useCreateElement(elements, canvasConfig);
    const { updateElement } = useUpdateElement();
    const { renderElements } = useRenderElement(canvas, context, canvasConfig);
    let targetElement: IElement | null = null;
    let startPoint: IPoint | null = null;

    const canvasMove = (event: PointerEvent | TouchEvent) => {
        if (startPoint) {
            const { x, y } = getWhiteBoardPointPosition(
                event,
                canvasConfig
            );
            canvasConfig.scrollX += x - startPoint[0];
            canvasConfig.scrollY += y - startPoint[1];
            startPoint = [x, y];
            renderElements(elements.value);
        }
    };

    const handleDown = (event: PointerEvent | TouchEvent) => {
        switch (canvasConfig.optionType) {
            case OPTION_TYPE.MOUSE: {
                const { x, y } = getWhiteBoardPointPosition(
                    event,
                    canvasConfig
                );
                startPoint = [x, y];
                break;
            }
            case OPTION_TYPE.PEN: {
                const { x, y } = getCanvasPointPosition(event, canvasConfig);
                targetElement = createPenElement({ x, y });
                canvasConfig.isDrawing = true;
                break;
            }
            case OPTION_TYPE.ERASER: {
                const { x, y } = getCanvasPointPosition(event, canvasConfig);
                startPoint = [x, y];
                canvasConfig.isDrawing = true;
                break;
            }
        }
    };

    const handleMove = throttleRAF((event: PointerEvent | TouchEvent) => {
        // 绘制
        switch (canvasConfig.optionType) {
            case OPTION_TYPE.MOUSE: {
                canvasMove(event);
                break;
            }
            case OPTION_TYPE.PEN: {
                if (!canvasConfig.isDrawing || !targetElement) return;
                const { x, y } = getCanvasPointPosition(event, canvasConfig);
                drawOnCanvas(x, y);
                break;
            }
            case OPTION_TYPE.ERASER: {
                if (!canvasConfig.isDrawing || !startPoint) return;
                const { x, y } = getCanvasPointPosition(event, canvasConfig);
                const normalizedCanvasWidth = canvas.value!.width / canvasConfig.zoom;
                const normalizedCanvasHeight = canvas.value!.height / canvasConfig.zoom;
                const visibleElements = getVisibleElements(elements.value, canvasConfig.scrollX, canvasConfig.scrollY, normalizedCanvasWidth, normalizedCanvasHeight);
                checkCrossElements(
                    startPoint,
                    x,
                    y,
                    visibleElements
                );
                renderElements(elements.value);
                startPoint = [x, y];
                break;
            }
        }
    });

    const drawOnCanvas = (x: number, y: number) => {
        if (!targetElement) return;
        switch (targetElement.type) {
            case OPTION_TYPE.PEN: {
                const points = (targetElement as IPenElement).points;
                updateElement(targetElement, {
                    points: [
                        ...points,
                        [x - (targetElement as IPenElement).x, y - (targetElement as IPenElement).y]
                    ]
                });
                break;
            }
        }
        renderElements(elements.value);
    };

    const handleUp = (event: PointerEvent | TouchEvent) => {
        switch (canvasConfig.optionType) {
            case OPTION_TYPE.MOUSE: {
                canvasMove(event);
                break;
            }
            case OPTION_TYPE.PEN: {
                if (!canvasConfig.isDrawing || !targetElement) return;
                const points = (targetElement as IPenElement).points;
                if (points.length === 1) {
                    updateElement(targetElement, {
                        points: [...points, [0.0001, 0.0001]]
                    });
                } else {
                    const { x, y } = getCanvasPointPosition(
                        event,
                        canvasConfig
                    );
                    updateElement(targetElement, {
                        points: [
                            ...points,
                            [x - (targetElement as IPenElement).x, y - (targetElement as IPenElement).y]
                        ]
                    });
                }
                // 更新一下元素width和height 暂时没有考虑旋转角度
                const [minX, minY, maxX, maxY] = getBoundsCoordsFromPoints(
                    (targetElement as IPenElement).points
                );
                updateElement(targetElement, {
                    width: maxX - minX,
                    height: maxY - minY
                });
                renderElements(elements.value);
                break;
            }
            case OPTION_TYPE.ERASER: {
                if (!canvasConfig.isDrawing) return;
                // 橡皮擦模式在结束时过滤掉删除的元素
                elements.value = elements.value.filter(element => !element.isDelete);
                renderElements(elements.value);
                break;
            }
        }
        targetElement = null;
        startPoint = null;
        canvasConfig.isDrawing = false;
    };

    return {
        handleDown,
        handleMove,
        handleUp
    };
};

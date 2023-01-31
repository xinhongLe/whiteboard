import { Ref } from "vue";
import { OPTION_TYPE } from "../config";
import { ICanvasConfig, ICompassData, IElement, IRulerData } from "../types";
import useCreateElement from "./useCreateElement";
import useRenderElement from "./useRenderElement";
import useUpdateElement from "./useUpdateElement";

export default (
    canvas: Ref<HTMLCanvasElement | null>,
    context: Ref<CanvasRenderingContext2D | null>,
    elements: Ref<IElement[]>,
    storeElements: Ref<IElement[]>,
    canvasConfig: ICanvasConfig
) => {
    const { updateElement } = useUpdateElement(elements);
    const { renderElements } = useRenderElement(canvas, context, canvasConfig);
    const { createCompassElement, createRulerElement } = useCreateElement(elements, canvasConfig);
    let targetElement: IElement | null = null;
    const drawStart = (data: ICompassData | IRulerData) => {
        switch (canvasConfig.optionType) {
            case OPTION_TYPE.COMPASS: {
                targetElement = createCompassElement(data as ICompassData);
                break;
            }
            case OPTION_TYPE.RULER: {
                targetElement = createRulerElement(data as IRulerData)
            }
        }
        renderElements(elements.value);
    };

    const drawing = (data: ICompassData | IRulerData) => {
        if (!targetElement) return;
        switch (canvasConfig.optionType) {
            case OPTION_TYPE.COMPASS:
            case OPTION_TYPE.RULER: {
                updateElement(targetElement, {
                    ...data
                });
                break;
            }
        }
        renderElements(elements.value);
    };

    const drawEnd = () => {
        // 置空恢复暂存
        storeElements.value = [];
        targetElement = null;
    };

    return {
        drawStart,
        drawing,
        drawEnd
    };
};

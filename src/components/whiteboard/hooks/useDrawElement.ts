import { Ref } from "vue";
import { OPTION_TYPE } from "../config";
import { ICanvasConfig, ICompassData, IElement } from "../types";
import useCreateElement from "./useCreateElement";
import useRenderElement from "./useRenderElement";
import useUpdateElement from "./useUpdateElement";

export default (
    canvas: Ref<HTMLCanvasElement | null>,
    context: Ref<CanvasRenderingContext2D | null>,
    elements: Ref<IElement[]>,
    canvasConfig: ICanvasConfig
) => {
    const { updateElement } = useUpdateElement();
    const { renderElements } = useRenderElement(canvas, context, canvasConfig);
    const { createCompassElement } = useCreateElement(elements, canvasConfig);
    let targetElement: IElement | null = null;
    const drawStart = (data: ICompassData) => {
        switch (canvasConfig.optionType) {
            case OPTION_TYPE.COMPASS: {
                targetElement = createCompassElement(data);
                break;
            }
        }
        renderElements(elements.value);
    };

    const drawing = (data: ICompassData) => {
        if (!targetElement) return;
        switch (canvasConfig.optionType) {
            case OPTION_TYPE.COMPASS: {
                // targetElement = createCompassElement(data);
                updateElement(targetElement, {
                    ...data
                });
                break;
            }
        }
        renderElements(elements.value);
    };

    const drawEnd = () => {
        targetElement = null;
    };

    return {
        drawStart,
        drawing,
        drawEnd
    };
};

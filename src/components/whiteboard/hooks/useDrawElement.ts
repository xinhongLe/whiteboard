import {Ref} from "vue";
import {OPTION_TYPE} from "../config";
import {ICanvasConfig, ICompassData, IElement, IRulerData, IRulerElement} from "../types";
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
    const {updateElement} = useUpdateElement(elements);
    const {renderElements} = useRenderElement(canvas, context, canvasConfig);
    const {createCompassElement, createRulerElement} = useCreateElement(elements, canvasConfig);
    let targetElement: IElement | null = null;
    const drawStart = (data: ICompassData | IRulerData, type: string) => {
        if (OPTION_TYPE.COMPASS === type) {
            targetElement = createCompassElement(data as ICompassData);
        } else if (OPTION_TYPE.RULER === type) {
            targetElement = createRulerElement(data as IRulerData);
        }else if (OPTION_TYPE.RIGHTTRIANGLE === type) {
            targetElement = createRulerElement(data as IRulerData);
        }
        renderElements(elements.value);
    };

    const drawing = (data: ICompassData | IRulerData) => {
        if (!targetElement) return;
        updateElement(targetElement, {
            ...data
        });
        renderElements(elements.value);
    };

    const drawEnd = () => {
        if (targetElement && targetElement.type === OPTION_TYPE.RULER) {
            if ((targetElement as IRulerElement).points[0][0] === (targetElement as IRulerElement).points[1][0]) {
                // 直线只是一个点，移除该元素
                const index = elements.value.findIndex(element => element.id === targetElement!.id);
                elements.value.splice(index, 1);
            }
        }
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

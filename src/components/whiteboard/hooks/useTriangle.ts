import { computed, inject, Ref, ref } from "vue";
import { getAngle, normalizeAngle, throttleRAF } from "@/components/whiteboard/utils";
import { ICenter } from "@/components/whiteboard/types";

export default (width: Ref<number>) => {
    const disabled = inject("disabled");

    const x = ref(0);
    const y = ref(0);
    const angle = ref(0);
    const height = ref(0);
    const multiple = ref(1);
    const mode = ref("");
    const length1 = ref(0);
    const length2 = ref(0);
    const length3 = ref(0);

    const points = computed(() => `0,0 0,${height.value} ${width.value},${height.value}`);

    const isTriangleArea = (event: PointerEvent | TouchEvent) => {
        return Object.prototype.toString.call(event.target) === "[object SVGPolygonElement]";
    };

    const rotatePoint = (x1: number, y1: number, x2: number, y2: number, angle: number) => {
        return {
            x: (x1 - x2) * Math.cos(angle) - (y1 - y2) * Math.sin(angle) + x2,
            y: (x1 - x2) * Math.sin(angle) + (y1 - y2) * Math.cos(angle) + y2
        };
    };

    const handleMove = throttleRAF((event: PointerEvent | TouchEvent) => {
        if (Object.prototype.toString.call(event.target) === "[object SVGPolygonElement]") {
            document.body.style.cursor = "move";
        }
        if (Object.prototype.toString.call(event.target) === "[object HTMLDivElement]") {
            document.body.style.cursor = "default";
        }
        if (Object.prototype.toString.call(event.target) === "[object SVGSVGElement]") {
            document.body.style.cursor = "crosshair";
        }

        const rightTriangleBox = document.getElementById("rightTriangleBox");
        const isoscelesTriangleBox = document.getElementById("isoscelesTriangleBox");
        if (Object.prototype.toString.call(event.target) === "[object SVGSVGElement]") {
            if (rightTriangleBox) {
                rightTriangleBox.style.pointerEvents = "none";
            }
            if (isoscelesTriangleBox) {
                isoscelesTriangleBox.style.pointerEvents = "none";
            }
        } else {
            if (rightTriangleBox) {
                rightTriangleBox.style.pointerEvents = "all";
            }
            if (isoscelesTriangleBox) {
                isoscelesTriangleBox.style.pointerEvents = "all";
            }
        }
    });

    const dealForDrawLine = (center: ICenter, mousePoint: ICenter) => {
        const l = Math.hypot(center.x - mousePoint.x, center.y - mousePoint.y);
        const angleA = normalizeAngle(getAngle(mousePoint.x, mousePoint.y, center.x, center.y));
        const targetAngle = angleA - angle.value;
        if (targetAngle === 0) return l;
        return Math.abs(l * Math.sign((targetAngle * Math.PI) / 180));
    };

    return {
        x,
        y,
        mode,
        angle,
        points,
        height,
        length1,
        length2,
        length3,
        multiple,
        disabled,
        handleMove,
        rotatePoint,
        isTriangleArea,
        dealForDrawLine
    };
}

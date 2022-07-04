<template>
    <div class="ruler-container" ref="ruler">
        <div
            class="ruler-box"
            :style="{
                width: `${width}px`,
                left: `${x}px`,
                top: `${y}px`,
                transform: `rotate(${angle}deg)`
            }"
        >
            <div class="ruler-scale"></div>
            <div class="ruler-buttons">
                <div class="ruler-button ruler-close" @click="closeRuler()">
                    <img src="./images/close.svg" alt="" />
                </div>
                <div class="ruler-angle-text">
                    {{
                        viewText === "angle"
                            ? angle + "°"
                            : viewText === "length"
                            ? Math.abs(length) + "cm"
                            : ""
                    }}
                </div>
                <div class="ruler-button ruler-rotate">
                    <img src="./images/rotate.svg" alt="" />
                </div>
                <div class="ruler-button ruler-resize">
                    <img src="./images/resize.svg" alt="" />
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import {
    computed,
    onMounted,
    PropType,
    ref,
    defineProps,
    defineEmits,
    onUnmounted,
    inject
} from "vue";
import { ICanvasConfig, ICenter } from "../../types";
import { getAngle, getCanvasPointPosition } from "../../utils";

const canTouch = inject("canTouch");

const props = defineProps({
    canvasConfig: {
        type: Object as PropType<ICanvasConfig>,
        required: true
    }
});

const emit = defineEmits(["close", "drawStart", "drawing", "drawEnd"]);

const canvasConfig = computed(() => props.canvasConfig);

const width = ref(500);
const x = ref(0);
const y = ref(0);
const angle = ref(0);
const ruler = ref();
const mode = ref("");
const viewText = ref("");
const startPoint = { x: 0, y: 0 };
const length = ref(0);
let startAngle = 0;
let drawLine = [
    [0, 0],
    [0, 0]
];
let rulerCenter = { x: 0, y: 0 };

const dealForDrawLine = (center: ICenter, mousePoint: ICenter) => {
    const l = Math.hypot(center.x - mousePoint.x, center.y - mousePoint.y);
    const angleA = getAngle(mousePoint.x - center.x, mousePoint.y - center.y);
    const targetAngle = angleA - angle.value;
    if (targetAngle === 0) return l;
    const drawL = Math.abs(l * Math.sign((targetAngle * Math.PI) / 180));
    return drawL;
};

const handleMouseDown = (event: PointerEvent | TouchEvent) => {
    event.stopPropagation();
    if (event instanceof TouchEvent && event.touches.length > 1) return;
    const mouseX =
        event instanceof TouchEvent
            ? event.targetTouches[0]?.clientX | event.changedTouches[0].clientX
            : event.clientX;
    const mouseY =
        event instanceof TouchEvent
            ? event.targetTouches[0]?.clientY | event.changedTouches[0].clientY
            : event.clientY;
    startPoint.x = mouseX;
    startPoint.y = mouseY;
    if (
        event.target &&
        (event.target as Element).className === "ruler-buttons"
    ) {
        // move
        mode.value = "move";
        viewText.value = "";
    }

    if (
        event.target &&
        (event.target as Element).className === "ruler-button ruler-rotate"
    ) {
        // rotate
        mode.value = "rotate";
        viewText.value = "angle";
        startAngle = getAngle(
            mouseX - x.value - canvasConfig.value.offsetX,
            mouseY - y.value - canvasConfig.value.offsetY
        );
    }

    if (
        event.target &&
        (event.target as Element).className === "ruler-button ruler-resize"
    ) {
        // resize
        mode.value = "resize";
        viewText.value = "";
    }

    if (event.target && (event.target as Element).className === "ruler-scale") {
        // draw
        mode.value = "draw";
        viewText.value = "length";
        rulerCenter = getCanvasPointPosition(
            {
                x: x.value + canvasConfig.value.offsetX,
                y: y.value + canvasConfig.value.offsetY
            },
            canvasConfig.value
        );
        const point = getCanvasPointPosition(startPoint, canvasConfig.value);
        const line = dealForDrawLine(rulerCenter, point);
        drawLine = [
            [line, 0],
            [line, 0]
        ];
        length.value = 0;
        emit("drawStart", {
            ...rulerCenter,
            points: drawLine,
            angle: angle.value
        });
    }

    document.addEventListener(
        canTouch ? "touchmove" : "pointermove",
        handleMouseMove,
        { passive: true }
    );
    document.addEventListener(canTouch ? "touchend" : "pointerup", handleEnd, {
        passive: true
    });
};

const handleMouseMove = (event: PointerEvent | TouchEvent) => {
    event.stopPropagation();
    if (event instanceof TouchEvent && event.touches.length > 1) return;
    const mouseX =
        event instanceof TouchEvent
            ? event.targetTouches[0]?.clientX | event.changedTouches[0].clientX
            : event.clientX;
    const mouseY =
        event instanceof TouchEvent
            ? event.targetTouches[0]?.clientY | event.changedTouches[0].clientY
            : event.clientY;

    if (mode.value === "move") {
        x.value += mouseX - startPoint.x;
        y.value += mouseY - startPoint.y;
    }

    if (mode.value === "rotate") {
        const targetAngle = getAngle(
            mouseX - x.value - canvasConfig.value.offsetX,
            mouseY - y.value - canvasConfig.value.offsetY
        );
        angle.value += targetAngle - startAngle;
        startAngle = targetAngle;
    }

    if (mode.value === "resize") {
        width.value += mouseX - startPoint.x;
        if (width.value < 500) width.value = 500;
    }

    startPoint.x = mouseX;
    startPoint.y = mouseY;

    if (mode.value === "draw") {
        const point = getCanvasPointPosition(startPoint, canvasConfig.value);
        const line = dealForDrawLine(rulerCenter, point);
        drawLine[1] = [line, 0];
        length.value = Math.round((line - drawLine[0][0]) / 4) / 10;
        emit("drawing", {
            points: drawLine,
            angle: angle.value
        });
    }
};

const handleEnd = () => {
    mode.value = "";
    emit("drawEnd");
    document.removeEventListener(
        canTouch ? "touchmove" : "pointermove",
        handleMouseMove
    );
    document.removeEventListener(
        canTouch ? "touchend" : "pointerup",
        handleEnd
    );
};

const closeRuler = () => {
    emit("close");
};

onMounted(() => {
    if (ruler.value) {
        x.value = ruler.value.clientWidth / 2 - 250;
        y.value = ruler.value.clientHeight / 2 - 30;
    }

    document.addEventListener(
        canTouch ? "touchstart" : "pointerdown",
        handleMouseDown,
        { passive: true }
    );
});

onUnmounted(() => {
    document.removeEventListener(
        canTouch ? "touchstart" : "pointerdown",
        handleMouseDown
    );
});
</script>

<style lang="scss" scoped>
.ruler-container {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
}

.ruler-box {
    position: absolute;
    transform-origin: top left;
}

.ruler-scale {
    height: 20px;
    background-image: url(./images/scale.png);
    background-repeat: repeat-x;
    background-size: 600px 24px;
    background-color: rgba(0, 0, 0, 0.05);
}

.ruler-buttons {
    height: 87px;
    display: flex;
    align-items: center;
    cursor: move;
    background-color: rgba(248, 248, 248, 0.8);
}

.ruler-button {
    border-radius: 50%;
    border: 1px solid rgba(0, 0, 0, 0.1);
    height: 48px;
    width: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    &:hover {
        background-color: rgba(0, 0, 0, 0.05);
    }
    img {
        display: block;
        width: 32px;
        height: 32px;
        -webkit-user-drag: none;
        pointer-events: none;
    }

    &.ruler-close {
        margin-left: 20px;
        cursor: pointer;
    }

    &.ruler-resize {
        margin-right: 20px;
        cursor: default;
    }

    &.ruler-rotate {
        margin-right: 20px;
        cursor: default;
    }
}

.ruler-angle-text {
    flex: 1;
    font-size: 28px;
    font-weight: 600;
    color: #666666;
    text-align: center;
    line-height: 30px;
    margin-left: 48px;
    margin-right: 48px;
    pointer-events: none;
}
</style>

<template>
    <div class="compass-board" ref="compass">
        <div
            class="compass-box"
            :style="{
                transform: `translate(${x}px, ${y}px) rotate(${rotate}deg)`
            }"
        >
            <div class="compass-head-placeholder"></div>
            <div class="compass-leg">
                <div class="compass-left-leg">
                    <div class="left-leg-bg">
                        <div class="compass-center" ref="compassCenter"></div>
                    </div>
                </div>
                <div
                    class="compass-right-leg"
                    :style="{
                        transform: `rotate(${rightLegRotate}deg) translateY(-11px)`
                    }"
                >
                    <svg
                        style="width: 100%; overflow: visible; display: block"
                        xmlns="http://www.w3.org/2000/svg"
                        version="1.1"
                    >
                        <path
                            d="M2 347 L13 338 L1 332.5 Z"
                            fill="#FF1000"
                        ></path>
                    </svg>
                    <div class="right-leg-zoom"></div>
                    <div class="right-leg-pen"></div>
                    <div class="pen-area" ref="penArea"></div>
                </div>
            </div>
            <div
                class="compass-head"
                :style="{
                    transform: `rotate(${(rightLegRotate + 15) / 2}deg)`
                }"
            >
                <div class="compass-close">
                    <div class="close-bg" @click="close()">
                        <img src="./images/compass/head.svg" />
                    </div>
                </div>
                <div class="compass-drag-head">
                    <img
                        class="compass-drag-img"
                        src="./images/compass/move.svg"
                    />
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { ref, defineProps, onMounted, defineEmits, PropType, computed } from "vue";
import { ICanvasConfig } from "../../types";
import { getCanvasPointPosition, getWhiteBoardPointPosition } from "../../utils";
let startAngle = 0;
let drawAngle = 0;
let recordAngle = 0;
let startPoint = [0, 0];
let mode = "";
let center = { x: 0, y: 0 };
let drawPoint = { x: 0, y: 0 };
// 圆心实际在canvas中的位置坐标
let canvasCircleCenter = { x: 0, y: 0 };

const x = ref(531);
const y = ref(108);
const rotate = ref(0);
const rightLegRotate = ref(-15);
const compass = ref();
const compassCenter = ref();
const penArea = ref();

const emit = defineEmits(["close", "drawStart", "drawing", "drawEnd"]);

const props = defineProps({
    canvasConfig: {
        type: Object as PropType<ICanvasConfig>,
        required: true
    }
});

const canvasConfig = computed(() => props.canvasConfig);

onMounted(() => {
    compass.value.addEventListener("pointerdown", handleMouseDown);
});

const getAngle = (x: number, y: number) => {
    const angle = Math.round(
        (Math.atan(Math.abs(y) / Math.abs(x)) / Math.PI) * 180
    );

    return x > 0 ? (y > 0 ? angle : -angle) : y > 0 ? 180 - angle : angle - 180;
};

const getDrawAngle = (x: number, y: number) => {
    const angle = Math.round(
        (Math.atan(Math.abs(y) / Math.abs(x)) / Math.PI) * 180
    );
    let resultAngle = 0;
    if (x > 0 && y < 0) {
        resultAngle = 360 - Math.abs(angle);
    } else if (x < 0 && y < 0) {
        resultAngle = 180 + Math.abs(angle);
    } else if (x < 0 && y > 0) {
        resultAngle = 180 - Math.abs(angle);
    } else {
        resultAngle = Math.abs(angle);
    }
    return resultAngle;
};

const getDrawPointer = () => {
    const { x, y } = penArea.value.getBoundingClientRect();
    return { x, y };
};

const getCompassCenter = () => {
    const { x, y } = compassCenter.value.getBoundingClientRect();
    // return getWhiteBoardPointPosition({ x: x as number, y: y as number }, canvasConfig.value);
    return { x, y };
}

const handleMouseDown = (event: PointerEvent) => {
    event.stopPropagation();
    const mouseX = event.clientX;
    const mouseY = event.clientY;
    center = getCompassCenter();
    drawPoint = getDrawPointer();
    if (
        event.target &&
        (event.target as Element).className === "right-leg-zoom"
    ) {
        mode = "setAngle";
        startPoint = [mouseX, mouseY];
    }

    if (
        event.target &&
        (event.target as Element).className === "compass-drag-img"
    ) {
        mode = "move";
        startPoint = [mouseX, mouseY];
    }

    if (
        event.target &&
        (event.target as Element).className === "right-leg-pen"
    ) {
        mode = "draw";
        startAngle = getDrawAngle(
            drawPoint.x - center.x,
            drawPoint.y - center.y
        );
        startAngle = startAngle === 360 ? 0 : startAngle;
        recordAngle = startAngle;
        drawAngle = startAngle;
        startPoint = [mouseX, mouseY];
        canvasCircleCenter = getCanvasPointPosition(center, canvasConfig.value);
        emit("drawStart", {
            r: 0,
            startAngle,
            drawAngle,
            x: canvasCircleCenter.x,
            y: canvasCircleCenter.y
        });
    }

    compass.value.addEventListener("pointermove", handleMouseMove);
    compass.value.addEventListener("pointerup", handleEnd);
};

const handleMouseMove = (event: MouseEvent) => {
    event.stopPropagation();
    const mouseX = event.clientX;
    const mouseY = event.clientY;
    if (mode === "setAngle" || mode === "draw") {
        const moveX = mouseX - startPoint[0];
        const moveY = mouseY - startPoint[1];
        // startPoint = [mouseX, mouseY];

        let compassAngle = 0;
        let r = 0;
        const newDrawPoint = {
            x: drawPoint.x + moveX,
            y: drawPoint.y + moveY
        };

        if (mode === "setAngle") {
            // 通过鼠标移动，计算圆规绘制点的新坐标
            r = Math.hypot(
                newDrawPoint.x - center.x,
                newDrawPoint.y - center.y
            );

            compassAngle = ((2 * Math.asin(r / 2 / 348)) / Math.PI) * 180;
            rightLegRotate.value = 15 - compassAngle;
        } else {
            const angle = getDrawAngle(
                newDrawPoint.x - center.x,
                newDrawPoint.y - center.y
            );

            if (Math.abs(angle - recordAngle) > 180) {
                // 跨区域旋转
                drawAngle +=
                    (360 - Math.abs(angle - recordAngle)) *
                    Math.sign(angle - recordAngle);
            } else {
                drawAngle += angle - recordAngle;
            }

            recordAngle = angle;

            const drawCanvasPoint = getCanvasPointPosition(drawPoint, canvasConfig.value);
            r = Math.hypot(drawCanvasPoint.x - canvasCircleCenter.x, drawCanvasPoint.y - canvasCircleCenter.y);

            compassAngle = ((2 * Math.asin(r / 2 / 348)) / Math.PI) * 180;
            emit("drawing", {
                r,
                startAngle,
                drawAngle,
                x: canvasCircleCenter.x,
                y: canvasCircleCenter.y
            });
        }

        const angle = getAngle(
            newDrawPoint.x - center.x,
            newDrawPoint.y - center.y
        );
        rotate.value = compassAngle / 2 - 15 + angle;
    }

    if (mode === "move") {
        x.value = x.value + mouseX - startPoint[0];
        y.value = y.value + mouseY - startPoint[1];
        startPoint = [mouseX, mouseY];
    }
};

const close = () => {
    emit("close");
};

const handleEnd = () => {
    emit("drawEnd");
    mode = "";
    compass.value.removeEventListener("pointermove", handleMouseMove);
    compass.value.removeEventListener("pointerup", handleEnd);
};
</script>

<style lang="scss" scoped>
.compass-board {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    // pointer-events: none;
    /* background: red; */
}

.compass-box {
    width: 218px;
    height: 505px;
    position: absolute;
    opacity: 1;
    z-index: 1;
    transform-origin: 21.5px 475px;
    top: 0;
    left: 0;
}

.compass-head-placeholder {
    height: 150px;
}

.compass-leg {
    width: 100%;
    height: 348px;
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
    flex-wrap: nowrap;
}

.compass-left-leg {
    width: 109px;
    height: 348px;
    display: flex;
    flex-direction: row-reverse;
    transform-origin: 109px 348px;
    transform: rotate(15deg) translateX(-90px);
}

.left-leg-bg {
    height: 348px;
    width: 43px;
    background-image: url(./images/compass/left-leg.png);
    background-repeat: no-repeat;
    background-size: 100% 100%;
    display: flex;
    align-items: flex-end;
    justify-content: flex-end;
}

.compass-right-leg {
    width: 109px;
    height: 348px;
    background-image: url(./images/compass/right-leg.png);
    background-size: 100% 100%;
    transform-origin: 0 0;
}

.right-leg-zoom {
    width: 32px;
    height: 32px;
    background-image: url(./images/compass/adjust.svg);
    background-size: 100% 100%;
    margin: 109px 0 0 57px;
    pointer-events: all;
}

.right-leg-pen {
    width: 34px;
    height: 220px;
    margin: -154px 0 0 30px;
    transform: rotate(25deg);
    pointer-events: all;
    user-select: none;
}

.compass-head {
    margin: -502px auto 0;
    transform-origin: 109px 156px;
}

.compass-close {
    width: 60px;
    height: 60px;
    margin: auto;
}

.close-bg {
    border-radius: 50%;
    border: 1px solid rgba(0, 0, 0, 0.1);
    box-shadow: 0 0 5px rgb(0 0 0 / 10%);
    height: 48px;
    width: 48px;
    margin: 0 auto;
    background: #ffffff;
    display: flex;
    justify-content: center;
    align-items: center;
    pointer-events: all;
    cursor: pointer;
}

.close-bg img {
    width: 28px;
    height: 28px;
    margin: 10px;
    display: block;
    -webkit-user-drag: none;
}

.compass-drag-head {
    height: 134px;
    width: 78px;
    background-image: url(./images/compass/head-bg.png);
    background-size: 100% 100%;
    background-position: center;
    position: relative;
    margin: 0 auto;
}

.compass-drag-head img {
    width: 32px;
    height: 32px;
    margin: 70px 23px 0px;
    -webkit-user-drag: none;
    pointer-events: all;
    cursor: move;
}

.pen-area {
    position: absolute;
    left: 0;
    bottom: 0;
}
</style>

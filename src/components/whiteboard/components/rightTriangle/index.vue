<template>
    <div class="triangle-container" ref="rightTriangleRef">
        <div
            class="triangle-box"
            :style="{
            top: `${y}px`,
            left: `${x}px`,
            width:width+'px',
            height:height+'px',
            transformOrigin: `0 ${height }px`,
            transform: `rotate(${angle}deg) scale(${multiple})`,
        }"
        >
            <div class="content">
                <svg :width="width" :height="height">
                    <polygon :points="points" style="fill: rgba(248, 248, 248, 0.8)"/>
                </svg>
                <div class="measurement-box ruler1">
                    <div class="triangle-number" v-for="num in length1" :key="num">
                        <span class="num">{{ num }}</span>
                    </div>
                    <div class="right-triangle-scale" id="triangleScale1"></div>
                </div>
                <div class="measurement-box ruler2">
                    <div class="triangle-number" v-for="num in length2" :key="num">
                        <span class="num">{{ num }}</span>
                    </div>
                    <div class="right-triangle-scale" id="triangleScale2"></div>
                </div>
                <div class="measurement-box ruler3">
                    <div class="triangle-number" v-for="num in length3" :key="num">
                        <span class="num">{{ num }}</span>
                    </div>
                    <div class="right-triangle-scale" id="triangleScale3"></div>
                </div>

                <div class="triangle-buttons">
                    <div class="ruler-button triangle-close" @click="close()">
                        <img src="../ruler/images/close.svg" alt=""/>
                    </div>
                    <div class="ruler-button right-triangle-magnify">
                        <img src="../ruler/images/resize.svg" alt=""/>
                    </div>
                    <div class="ruler-button right-triangle-rotate">
                        <img src="../ruler/images/rotate.svg" alt=""/>
                    </div>
                    <div class="ruler-button right-triangle-resize">
                        <img src="../ruler/images/resize.svg" alt=""/>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { OPTION_TYPE } from "@/components/whiteboard/config";
import { ICanvasConfig, ICenter, IElement } from "@/components/whiteboard/types";
import { computed, defineComponent, inject, onMounted, onUnmounted, PropType, ref } from "vue";
import { getAngle, getCanvasPointPosition, normalizeAngle, throttleRAF } from "@/components/whiteboard/utils";

export default defineComponent({
    name: "RightTriangle",
    emits: ["close", "drawEnd", "drawStart", "drawing"],
    props: {
        canvasConfig: {
            type: Object as PropType<ICanvasConfig>,
            required: true
        },
        elements: {
            type: Array as PropType<IElement[]>,
            required: true
        }
    },
    setup(props, { emit }) {
        const disabled = inject("disabled");

        const x = ref(0);
        const y = ref(0);
        const angle = ref(0);
        const mode = ref("");
        const height = ref(0);
        const width = ref(600);
        const length1 = ref(0);
        const length2 = ref(0);
        const length3 = ref(0);
        const multiple = ref(1);
        const rightTriangleRef = ref();

        let logAngle = 0;
        let drawAngle = 0;
        let startAngle = 0;
        let isAdsorption = false;
        const startPoint = { x: 0, y: 0 };
        let triangleCenter = { x: 0, y: 0 };
        let drawLine = [
            [0, 0],
            [0, 0]
        ];

        const points = computed(() => `0,0 0,${height.value} ${width.value},${height.value}`);

        const updateNumberList = () => {
            height.value = width.value * Math.tan(30 * (Math.PI / 180));
            const hypotenuse = width.value / Math.cos(30 * (Math.PI / 180));

            length1.value = Math.floor((width.value - 120) / 40);
            length2.value = Math.floor((height.value - 50) / 40);
            length3.value = Math.floor((hypotenuse - 140) / 40);
        };

        const close = () => {
            emit("close");
        };

        const handleMouseDown = (event: PointerEvent | TouchEvent) => {
            event.stopPropagation();
            if (disabled) return;

            const touchFlag = event instanceof TouchEvent;
            if (touchFlag && event.touches.length > 1) return;

            const mouseX = touchFlag ? event.targetTouches[0] ? event.targetTouches[0].clientX : event.changedTouches[0].clientX : event.clientX;
            const mouseY = touchFlag ? event.targetTouches[0] ? event.targetTouches[0].clientY : event.changedTouches[0].clientY : event.clientY;

            startPoint.x = mouseX;
            startPoint.y = mouseY;

            const className = typeof (event.target as Element).className === "string" ? (event.target as Element).className : "";
            if (isTriangleArea(event) && className !== "right-triangle-scale") {
                mode.value = "move";
            }

            if (className === "ruler-button right-triangle-magnify") {
                mode.value = "magnify";
            }
            if (className === "ruler-button right-triangle-resize") {
                mode.value = "resize";
            }
            if (className === "ruler-button right-triangle-rotate") {
                mode.value = "rotate";
                startAngle = getAngle(
                    mouseX - props.canvasConfig.offsetX,
                    mouseY - props.canvasConfig.offsetY,
                    x.value,
                    y.value
                );
                logAngle = (angle.value * Math.PI) / 180;
            }
            if (className.includes("right-triangle-scale")) {
                const id = (event.target as Element).id;
                mode.value = "draw";
                triangleCenter = getCanvasPointPosition(
                    {
                        x: x.value + props.canvasConfig.offsetX,
                        y: y.value + (id === "triangleScale3" ? 0 : height.value) + props.canvasConfig.offsetY
                    },
                    props.canvasConfig
                );
                if (id === "triangleScale1") {
                    drawAngle = 0;
                }
                if (id === "triangleScale2") {
                    drawAngle = 270;
                }
                if (id === "triangleScale3") {
                    triangleCenter = rotatePoint(
                        triangleCenter.x,
                        triangleCenter.y,
                        x.value,
                        y.value + height.value,
                        angle.value * (Math.PI / 180)
                    );
                    drawAngle = 30;
                }
                const point = getCanvasPointPosition(startPoint, props.canvasConfig);
                const line = dealForDrawLine(triangleCenter, point);
                drawLine = [
                    [line, 0],
                    [line, 0]
                ];
                emit("drawStart", {
                    ...triangleCenter,
                    points: drawLine,
                    angle: drawAngle
                }, OPTION_TYPE.RIGHTTRIANGLE);
            }

            if (event instanceof TouchEvent) {
                document.addEventListener("touchmove", handleMouseMove, { passive: true });
                document.addEventListener("touchend", handleEnd, { passive: true });
            } else {
                document.addEventListener("pointermove", handleMouseMove, { passive: true });
                document.addEventListener("pointerup", handleEnd, { passive: true });
            }
        };

        const handleMouseMove = throttleRAF((event: PointerEvent | TouchEvent) => {
            event.stopPropagation();
            if (disabled || isAdsorption) return;
            if (event instanceof TouchEvent && event.touches.length > 1) return;

            const mouseX =
                event instanceof TouchEvent
                    ? event.targetTouches[0] ? event.targetTouches[0].clientX : event.changedTouches[0].clientX
                    : event.clientX;
            const mouseY =
                event instanceof TouchEvent
                    ? event.targetTouches[0] ? event.targetTouches[0].clientY : event.changedTouches[0].clientY
                    : event.clientY;

            if (mode.value === "move") {
                x.value += mouseX - startPoint.x;
                y.value += mouseY - startPoint.y;

                // 判断吸附
                // 往上移动，才做判断
                if (mouseY - startPoint.y < 0 && !isAdsorption) {
                    const targetRulerElements = props.elements.filter(element => element.angle === angle.value && element.type === OPTION_TYPE.RULER);
                    const targetElement = targetRulerElements.find(element => y.value - element.y < 10 && y.value - element.y > 0);
                    if (targetElement) {
                        y.value = targetElement.y;
                        isAdsorption = true;
                        setTimeout(() => {
                            // 完成吸附后 300ms内禁止其他操作
                            isAdsorption = false;
                        }, 300);
                    }
                }
            }

            if (mode.value === "rotate") {
                const targetAngle = getAngle(
                    mouseX - props.canvasConfig.offsetX,
                    mouseY - props.canvasConfig.offsetY,
                    x.value,
                    y.value
                );
                const changeAngle = targetAngle - startAngle;
                angle.value = Math.floor(normalizeAngle(changeAngle + logAngle));
            }

            if (mode.value === "magnify") {
                const reduce = startPoint.y - mouseY;

                if (reduce > 0) {
                    multiple.value += 0.05;
                } else {
                    if (multiple.value === 1) return;
                    multiple.value -= 0.05;
                }
            }

            if (mode.value === "resize") {
                width.value += mouseX - startPoint.x;
                if (width.value < 500) width.value = 500;
                updateNumberList();
            }

            startPoint.x = mouseX;
            startPoint.y = mouseY;

            if (mode.value === "draw") {
                const point = getCanvasPointPosition({
                    x: startPoint.x,
                    y: startPoint.y
                }, props.canvasConfig);
                const line = dealForDrawLine(triangleCenter, point);
                drawLine[1] = [line, 0];
                emit("drawing", {
                    points: drawLine,
                    angle: angle.value + drawAngle
                });
            }
        });

        const handleEnd = (event: PointerEvent | TouchEvent) => {
            mode.value = "";
            emit("drawEnd");
            if (event instanceof TouchEvent) {
                document.removeEventListener("touchmove", handleMouseMove);
                document.removeEventListener("touchend", handleEnd);
            } else {
                document.removeEventListener("pointermove", handleMouseMove);
                document.removeEventListener("pointerup", handleEnd);
            }
        };

        const dealForDrawLine = (center: ICenter, mousePoint: ICenter) => {
            const l = Math.hypot(center.x - mousePoint.x, center.y - mousePoint.y);
            const angleA = normalizeAngle(getAngle(mousePoint.x, mousePoint.y, center.x, center.y));
            const targetAngle = angleA - angle.value;
            if (targetAngle === 0) return l;
            return Math.abs(l * Math.sign((targetAngle * Math.PI) / 180));
        };

        // 判断鼠标按下的点是否在三角形之内
        function isTriangleArea(event: PointerEvent | TouchEvent) {
            let dot = getCanvasPointPosition(event, props.canvasConfig);
            const radian = (360 - angle.value) * Math.PI / 180;
            dot = rotatePoint(dot.x, dot.y, x.value, y.value + height.value, radian);
            const point1 = { x: x.value, y: y.value };
            const point2 = { x: x.value + width.value, y: y.value + height.value };

            if (multiple.value > 1) {
                point1.y = point2.y - height.value * multiple.value;
                point2.x = y.value + height.value * multiple.value;
            }

            if (!(dot.x > point1.x && dot.x < point2.x && dot.y > point1.y && dot.y < point2.y)) return false;

            const k = (point2.y - point1.y) / (point2.x - point1.x);
            const b = point1.y - k * point1.x;
            const b1 = dot.y - k * dot.x;
            return b1 > b;
        }

        function rotatePoint(x1: number, y1: number, x2: number, y2: number, angle: number) {
            return {
                x: (x1 - x2) * Math.cos(angle) - (y1 - y2) * Math.sin(angle) + x2,
                y: (x1 - x2) * Math.sin(angle) + (y1 - y2) * Math.cos(angle) + y2
            };
        }

        onMounted(() => {
            updateNumberList();

            if (rightTriangleRef.value) {
                x.value = rightTriangleRef.value.clientWidth / 2 - 250;
                y.value = rightTriangleRef.value.clientHeight / 2 - height.value / 2;
            }

            document.addEventListener("touchstart", handleMouseDown, { passive: true });
            document.addEventListener("pointerdown", handleMouseDown, { passive: true });
        });

        onUnmounted(() => {
            document.removeEventListener("touchstart", handleMouseDown);
            document.removeEventListener("pointerdown", handleMouseDown);
        });

        return {
            x,
            y,
            close,
            angle,
            width,
            height,
            points,
            length1,
            length2,
            length3,
            multiple,
            rightTriangleRef
        };
    }
});
</script>

<style scoped lang="scss">
.triangle-container {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    pointer-events: none;
}

.triangle-box {
    position: absolute;
    transform-origin: top left;
    overflow: hidden;
    pointer-events: all;

    .content {
        position: relative;
        width: 100%;
        height: 100%;
    }
}

.measurement-box {
    height: 20px;
    position: absolute;
    display: flex;
    transform-origin: 0 0;

    .right-triangle-scale {
        position: absolute;
        display: flex;
        height: 20px;
        background-image: url(../ruler/images/scale.png);
        background-repeat: repeat-x;
        background-size: 600px 25px;
        width: 100%;
    }

    .triangle-number {
        font-size: 12px;
        width: 40px;
        min-width: 40px;
        position: relative;

        .num {
            display: block;
            position: absolute;
            transform: translateX(50%);
        }
    }

    &.ruler1 {
        bottom: 0;
        left: 20px;

        .right-triangle-scale {
            transform: scaleY(-1);
        }

        .num {
            top: -12px;
            right: 0;
        }
    }

    &.ruler2 {
        bottom: 0;
        left: 0;
        transform: rotate(-90deg);

        .right-triangle-scale {
            transform: scaleX(-1);
        }

        .num {
            top: 20px;
            right: 0;
        }
    }

    &.ruler3 {
        top: 0;
        left: 0;
        transform: rotate(30deg) translateX(50px);

        .num {
            top: 20px;
            right: 0;
        }
    }
}

.triangle-buttons {
    height: 50px;
    display: flex;
    align-items: center;
    position: absolute;
    left: 0;
    top: 0;
    width: 60%;
    transform: rotate(30deg) translate(95px, 35px);
    transform-origin: 0 0;
    justify-content: space-between;
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

    &.triangle-close {
        cursor: pointer;
        margin-right: 20px;
    }

    &.triangle-restore {
        margin-right: 20px;
        cursor: pointer;
    }

    &.right-triangle-magnify {
        margin-right: 20px;
        cursor: default;
        transform: rotate(90deg);

    }

    &.right-triangle-resize {
        margin-right: 20px;
        cursor: default;

    }

    &.right-triangle-rotate {
        margin-right: 20px;
        cursor: default;
    }
}
</style>

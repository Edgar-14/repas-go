import React, { useRef, useEffect } from "react";

const AnimatedBackground: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        let width = window.innerWidth;
        let height = window.innerHeight;
        canvas.width = width;
        canvas.height = height;

        let trails: { x: number; y: number; alpha: number }[] = [];
        const mouse = { x: width / 2, y: height / 2 };

        function draw() {
            ctx!.clearRect(0, 0, width, height);

            // Pinta el fondo del canvas en cada fotograma
            ctx!.fillStyle = '#F4F7FE';
            ctx!.fillRect(0, 0, width, height);

            for (let i = 0; i < trails.length; i++) {
                const t = trails[i];
                ctx!.beginPath();
                ctx!.arc(t.x, t.y, 32, 0, 2 * Math.PI);
                ctx!.fillStyle = `rgba(58,141,222,${t.alpha * 0.08})`;
                ctx!.fill();
            }
        }

        function animate() {
            for (let i = 0; i < trails.length; i++) {
                trails[i].alpha *= 0.96;
            }
            trails = trails.filter(t => t.alpha > 0.01);
            draw();
            requestAnimationFrame(animate);
        }

        function handleMouseMove(e: MouseEvent) {
            mouse.x = e.clientX;
            mouse.y = e.clientY;
            trails.push({ x: mouse.x, y: mouse.y, alpha: 1 });
        }

        window.addEventListener("mousemove", handleMouseMove);
        animate();

        const handleResize = () => {
            width = window.innerWidth;
            height = window.innerHeight;
            canvas.width = width;
            canvas.height = height;
        };

        window.addEventListener("resize", handleResize);

        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("resize", handleResize);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            style={{
                position: "fixed",
                top: 0,
                left: 0,
                width: "100vw",
                height: "100vh",
                pointerEvents: "none",
                zIndex: -1,
            }}
        />
    );
};

export default AnimatedBackground;
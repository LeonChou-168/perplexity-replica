import { useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { BufferGeometry, ShaderMaterial, Vector3 } from "three";
import { readVisualTestFixture } from "../hooks/useVisualTest";
import { assetPath } from "../lib/assets";
import type { VisualStateFixture } from "../types";
import styles from "./UnifiesScene.module.css";

gsap.registerPlugin(ScrollTrigger, useGSAP);

interface UnifiesSceneProps {
  title: string;
  reducedMotion: boolean;
  visualTest: boolean;
}

interface TitleWord {
  word: string;
  characters: Array<{ character: string; index: number }>;
}

type HelixLayer = "back" | "front";

interface HelixRenderer {
  render: (progress: number) => void;
  dispose: () => void;
}

const VISUAL_TEST_PROGRESS = 0.58;
const TAU = Math.PI * 2;

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function smoothstep(start: number, end: number, value: number): number {
  const progress = clamp01((value - start) / (end - start));
  return progress * progress * (3 - 2 * progress);
}

function splitTitle(title: string): TitleWord[] {
  let characterIndex = 0;

  return title.trim().split(/\s+/).map((word) => ({
    word,
    characters: Array.from(word, (character) => ({ character, index: characterIndex++ })),
  }));
}

function prepareCanvas(canvas: HTMLCanvasElement): {
  context: CanvasRenderingContext2D;
  width: number;
  height: number;
} | null {
  const context = canvas.getContext("2d");
  if (!context) return null;

  const view = canvas.ownerDocument.defaultView;
  const width = Math.max(1, Math.round(canvas.clientWidth || view?.innerWidth || 1));
  const height = Math.max(1, Math.round(canvas.clientHeight || view?.innerHeight || 1));
  const density = Math.min(2, Math.max(1, view?.devicePixelRatio || 1));
  const pixelWidth = Math.round(width * density);
  const pixelHeight = Math.round(height * density);

  if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
    canvas.width = pixelWidth;
    canvas.height = pixelHeight;
  }

  context.setTransform(density, 0, 0, density, 0, 0);
  context.clearRect(0, 0, width, height);

  return { context, width, height };
}

function drawDreamcloud(canvas: HTMLCanvasElement, progress: number): void {
  const prepared = prepareCanvas(canvas);
  if (!prepared) return;

  const { context, width, height } = prepared;
  const travel = (progress - 0.5) * height * 0.16;

  context.globalCompositeOperation = "screen";
  context.filter = `blur(${Math.max(20, Math.min(width, height) * 0.045)}px)`;

  for (let band = 0; band < 4; band += 1) {
    const baseline = height * (0.12 + band * 0.24) - travel;
    const amplitude = height * (0.07 + band * 0.008);
    const phase = progress * TAU * 0.36 + band * 1.37;
    const gradient = context.createLinearGradient(0, baseline - amplitude, width, baseline + amplitude);

    gradient.addColorStop(0, "rgba(24, 47, 31, 0)");
    gradient.addColorStop(0.28, "rgba(80, 118, 84, 0.26)");
    gradient.addColorStop(0.62, "rgba(205, 220, 184, 0.16)");
    gradient.addColorStop(1, "rgba(25, 48, 31, 0)");

    context.beginPath();
    context.moveTo(-width * 0.08, baseline + amplitude);
    for (let step = 0; step <= 16; step += 1) {
      const x = (step / 16) * width;
      const y = baseline + Math.sin((step / 16) * TAU * 1.35 + phase) * amplitude;
      context.lineTo(x, y);
    }
    context.lineTo(width * 1.08, baseline + amplitude * 2.2);
    context.lineTo(-width * 0.08, baseline + amplitude * 2.2);
    context.closePath();
    context.fillStyle = gradient;
    context.globalAlpha = 0.42 - band * 0.055;
    context.fill();
  }

  context.filter = "none";
  context.globalAlpha = 1;
  context.globalCompositeOperation = "source-over";
}

function drawHelix(canvas: HTMLCanvasElement, progress: number, layer: HelixLayer): void {
  const prepared = prepareCanvas(canvas);
  if (!prepared) return;

  const { context, width, height } = prepared;
  const segmentCount = 112;
  const amplitude = Math.max(112, Math.min(width * 0.22, 360));
  const centerX = width * 0.5;
  const baseWidth = Math.max(18, Math.min(width, height) * 0.052);
  const verticalTravel = progress * height * 0.42;

  const pointAt = (step: number, strand: number) => {
    const t = step / segmentCount;
    const angle = t * TAU * 1.9 + progress * TAU * 0.76 + strand * Math.PI;
    return {
      x: centerX + Math.sin(angle) * amplitude,
      y: (t * 1.55 - 0.24) * height - verticalTravel,
      depth: Math.cos(angle),
    };
  };

  context.lineCap = "round";
  context.lineJoin = "round";

  for (let strand = 0; strand < 2; strand += 1) {
    for (let step = 0; step < segmentCount; step += 1) {
      const from = pointAt(step, strand);
      const to = pointAt(step + 1, strand);
      const depth = (from.depth + to.depth) * 0.5;
      const isFront = depth >= 0;
      if (isFront !== (layer === "front")) continue;

      const depthWeight = 0.72 + (depth + 1) * 0.14;
      const alpha = (layer === "front" ? 0.72 : 0.34) * (0.78 + Math.abs(depth) * 0.22);
      const color = strand === 0
        ? `rgba(86, 145, 107, ${alpha})`
        : `rgba(216, 230, 195, ${alpha * 0.88})`;

      context.beginPath();
      context.moveTo(from.x, from.y);
      context.lineTo(to.x, to.y);
      context.lineWidth = baseWidth * depthWeight;
      context.strokeStyle = color;
      context.shadowColor = layer === "front" ? "rgba(221, 239, 205, 0.18)" : "transparent";
      context.shadowBlur = layer === "front" ? 12 : 0;
      context.stroke();

      if (layer === "front") {
        context.beginPath();
        context.moveTo(from.x, from.y);
        context.lineTo(to.x, to.y);
        context.lineWidth = Math.max(1.25, baseWidth * 0.075);
        context.strokeStyle = strand === 0 ? "rgba(204, 231, 197, 0.34)" : "rgba(250, 248, 235, 0.28)";
        context.shadowBlur = 0;
        context.stroke();
      }
    }
  }

  context.shadowBlur = 0;
  for (let step = 5; step < segmentCount; step += 8) {
    const from = pointAt(step, 0);
    const to = pointAt(step, 1);
    const isFront = Math.sin((step / segmentCount) * TAU * 1.9 + progress * TAU * 0.76) >= 0;
    if (isFront !== (layer === "front")) continue;

    context.beginPath();
    context.moveTo(from.x, from.y);
    context.lineTo(to.x, to.y);
    context.lineWidth = layer === "front" ? 1.5 : 1;
    context.strokeStyle = layer === "front" ? "rgba(235, 241, 218, 0.25)" : "rgba(94, 130, 98, 0.18)";
    context.stroke();
  }
}

function createHelixRenderer(
  canvas: HTMLCanvasElement,
  layer: HelixLayer,
  THREE: typeof import("three"),
): HelixRenderer | null {
  const contextOptions: WebGLContextAttributes = {
    alpha: true,
    antialias: true,
    depth: true,
    powerPreference: "high-performance",
    premultipliedAlpha: false,
    preserveDrawingBuffer: true,
  };
  const context = canvas.getContext("webgl2", contextOptions) ?? canvas.getContext("webgl", contextOptions);
  if (!context) return null;

  try {
    const renderer = new THREE.WebGLRenderer({
      canvas,
      context,
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
      premultipliedAlpha: false,
      preserveDrawingBuffer: true,
    });
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x07100a, layer === "front" ? 0.055 : 0.1);
    const camera = new THREE.PerspectiveCamera(39, 1, 0.1, 50);
    camera.position.set(0, 0, layer === "front" ? 7.2 : 8.4);

    const helix = new THREE.Group();
    scene.add(helix);

    const shaderMaterials: ShaderMaterial[] = [];
    const geometries: BufferGeometry[] = [];
    const curvePoints: Vector3[][] = [[], []];
    const turns = 2.15;
    const pointCount = 180;
    const radius = layer === "front" ? 1.45 : 1.68;

    for (let strand = 0; strand < 2; strand += 1) {
      for (let index = 0; index <= pointCount; index += 1) {
        const t = index / pointCount;
        const angle = t * TAU * turns + strand * Math.PI;
        curvePoints[strand].push(new THREE.Vector3(
          Math.sin(angle) * radius,
          (0.5 - t) * 8.8,
          Math.cos(angle) * radius,
        ));
      }

      const curve = new THREE.CatmullRomCurve3(curvePoints[strand]);
      const geometry = new THREE.TubeGeometry(curve, 240, layer === "front" ? 0.085 : 0.07, 10, false);
      const material = new THREE.ShaderMaterial({
        uniforms: {
          uColor: { value: new THREE.Color(strand === 0 ? 0x75ad83 : 0xd8e4c7) },
          uOpacity: { value: layer === "front" ? 0.66 : 0.24 },
          uProgress: { value: 0 },
        },
        vertexShader: `
          varying vec2 vUv;
          varying float vDepth;
          void main() {
            vUv = uv;
            vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
            vDepth = clamp((-viewPosition.z - 3.0) / 8.0, 0.0, 1.0);
            gl_Position = projectionMatrix * viewPosition;
          }
        `,
        fragmentShader: `
          uniform vec3 uColor;
          uniform float uOpacity;
          uniform float uProgress;
          varying vec2 vUv;
          varying float vDepth;
          void main() {
            float pulse = 0.78 + 0.22 * sin((vUv.x + vUv.y + uProgress * 0.35) * 18.0);
            float edge = smoothstep(0.0, 0.12, vUv.x) * smoothstep(1.0, 0.88, vUv.x);
            float depthFade = mix(0.62, 1.0, vDepth);
            gl_FragColor = vec4(uColor * pulse, uOpacity * edge * depthFade);
          }
        `,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });
      shaderMaterials.push(material);
      geometries.push(geometry);
      helix.add(new THREE.Mesh(geometry, material));
    }

    const rungPositions: number[] = [];
    for (let index = 6; index < pointCount; index += 9) {
      const first = curvePoints[0][index];
      const second = curvePoints[1][index];
      rungPositions.push(first.x, first.y, first.z, second.x, second.y, second.z);
    }
    const rungGeometry = new THREE.BufferGeometry();
    rungGeometry.setAttribute("position", new THREE.Float32BufferAttribute(rungPositions, 3));
    const rungMaterial = new THREE.LineBasicMaterial({
      color: layer === "front" ? 0xe5edd7 : 0x62876b,
      transparent: true,
      opacity: layer === "front" ? 0.24 : 0.09,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    geometries.push(rungGeometry);
    helix.add(new THREE.LineSegments(rungGeometry, rungMaterial));

    let lastWidth = 0;
    let lastHeight = 0;
    const resize = () => {
      const width = Math.max(1, Math.round(canvas.clientWidth || window.innerWidth));
      const height = Math.max(1, Math.round(canvas.clientHeight || window.innerHeight));
      if (width === lastWidth && height === lastHeight) return;
      lastWidth = width;
      lastHeight = height;
      renderer.setPixelRatio(Math.min(2, Math.max(1, window.devicePixelRatio || 1)));
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };

    return {
      render: (progress) => {
        resize();
        helix.rotation.y = progress * TAU * 0.72 + (layer === "front" ? 0.12 : -0.18);
        helix.rotation.z = (progress - 0.5) * (layer === "front" ? 0.12 : -0.08);
        helix.position.y = (progress - 0.5) * 3.7;
        helix.position.z = layer === "front" ? 0.38 : -0.8;
        const compact = lastWidth <= 560;
        helix.scale.setScalar(compact ? 0.72 : lastWidth <= 960 ? 0.86 : 1);
        shaderMaterials.forEach((material) => {
          material.uniforms.uProgress.value = progress;
        });
        renderer.render(scene, camera);
      },
      dispose: () => {
        geometries.forEach((geometry) => geometry.dispose());
        shaderMaterials.forEach((material) => material.dispose());
        rungMaterial.dispose();
        renderer.dispose();
        renderer.forceContextLoss();
      },
    };
  } catch {
    return null;
  }
}

export function UnifiesScene({ title, reducedMotion, visualTest }: UnifiesSceneProps) {
  const visualFixture: VisualStateFixture = visualTest ? readVisualTestFixture() : { enabled: false };
  const deterministicProgress = visualTest
    ? visualFixture.unifiesProgress ?? VISUAL_TEST_PROGRESS
    : 0;
  const sectionRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const dreamcloudRef = useRef<HTMLCanvasElement>(null);
  const backHelixRef = useRef<HTMLCanvasElement>(null);
  const frontHelixRef = useRef<HTMLCanvasElement>(null);
  const mediaReadyRef = useRef(false);
  const mediaFailedRef = useRef(false);
  const lastProgressRef = useRef(deterministicProgress);
  const renderProgressRef = useRef<(progress: number) => void>(() => undefined);
  const [mediaReady, setMediaReady] = useState(false);
  const [mediaFailed, setMediaFailed] = useState(false);
  const titleWords = splitTitle(title);

  useGSAP(
    () => {
      const section = sectionRef.current;
      if (!section || reducedMotion) return;

      const video = videoRef.current;
      const dreamcloud = dreamcloudRef.current;
      const backHelix = backHelixRef.current;
      const frontHelix = frontHelixRef.current;
      const characters = Array.from(section.querySelectorAll<HTMLElement>("[data-unifies-char]"));
      let disposed = false;
      let rendererLoadFinished = false;
      let backRenderer: HelixRenderer | null = null;
      let frontRenderer: HelixRenderer | null = null;
      if (backHelix) backHelix.dataset.renderer = "loading";
      if (frontHelix) frontHelix.dataset.renderer = "loading";

      const renderProgress = (value: number) => {
        const progress = clamp01(value);
        const sceneOpacity = smoothstep(0, 0.1, progress) * (1 - smoothstep(0.9, 1, progress));
        const dreamOpacity = smoothstep(0.04, 0.22, progress) * (1 - smoothstep(0.84, 0.98, progress));
        const helixOpacity = smoothstep(0.1, 0.28, progress) * (1 - smoothstep(0.82, 0.97, progress));
        const titleEnvelope = smoothstep(0.28, 0.43, progress) * (1 - smoothstep(0.76, 0.9, progress));
        const titleProgress = clamp01((progress - 0.28) / 0.28);

        lastProgressRef.current = progress;
        section.dataset.progress = progress.toFixed(3);
        section.style.setProperty("--scene-opacity", sceneOpacity.toFixed(4));
        section.style.setProperty("--dream-opacity", dreamOpacity.toFixed(4));
        section.style.setProperty("--helix-opacity", helixOpacity.toFixed(4));
        section.style.setProperty("--title-opacity", titleEnvelope.toFixed(4));
        section.style.setProperty("--background-scale", (1.075 - progress * 0.075).toFixed(4));
        section.style.setProperty("--background-shift", `${((progress - 0.5) * -18).toFixed(2)}px`);

        const characterCount = Math.max(1, characters.length - 1);
        characters.forEach((character, index) => {
          const stagger = (index / characterCount) * 0.32;
          const reveal = smoothstep(stagger, Math.min(1, stagger + 0.48), titleProgress);
          character.style.opacity = reveal.toFixed(4);
          character.style.filter = `blur(${((1 - reveal) * 9).toFixed(2)}px)`;
          character.style.transform = `translate3d(0, ${((1 - reveal) * 26).toFixed(2)}px, 0)`;
        });

        if (video && mediaReadyRef.current && !mediaFailedRef.current && Number.isFinite(video.duration)) {
          const targetTime = Math.min(Math.max(0, video.duration - 0.04), video.duration * progress);
          if (Math.abs(video.currentTime - targetTime) > 1 / 48) video.currentTime = targetTime;
          video.pause();
        }

        if (dreamcloud) drawDreamcloud(dreamcloud, progress);
        if (backRenderer) backRenderer.render(progress);
        else if (rendererLoadFinished && backHelix) drawHelix(backHelix, progress, "back");
        if (frontRenderer) frontRenderer.render(progress);
        else if (rendererLoadFinished && frontHelix) drawHelix(frontHelix, progress, "front");
      };

      renderProgressRef.current = renderProgress;
      const initialProgress = visualTest ? deterministicProgress : lastProgressRef.current;
      renderProgress(initialProgress);

      void import("three")
        .then((THREE) => {
          if (disposed) return;
          backRenderer = backHelix ? createHelixRenderer(backHelix, "back", THREE) : null;
          frontRenderer = frontHelix ? createHelixRenderer(frontHelix, "front", THREE) : null;
          rendererLoadFinished = true;
          if (backHelix) backHelix.dataset.renderer = backRenderer ? "three-webgl" : "canvas-2d";
          if (frontHelix) frontHelix.dataset.renderer = frontRenderer ? "three-webgl" : "canvas-2d";
          renderProgress(lastProgressRef.current);
        })
        .catch(() => {
          if (disposed) return;
          rendererLoadFinished = true;
          if (backHelix) backHelix.dataset.renderer = "canvas-2d";
          if (frontHelix) frontHelix.dataset.renderer = "canvas-2d";
          renderProgress(lastProgressRef.current);
        });

      const handleResize = () => renderProgress(lastProgressRef.current);
      window.addEventListener("resize", handleResize, { passive: true });

      const progressState = { value: 0 };
      const visibilityTrigger = ScrollTrigger.create({
        id: "unifies-visibility",
        trigger: section,
        start: "top bottom",
        end: "bottom top",
        onToggle: ({ isActive }) => {
          section.dataset.sceneActive = isActive ? "true" : "false";
        },
      });
      const tween = visualTest
        ? null
        : gsap.to(progressState, {
            value: 1,
            ease: "none",
            onUpdate: () => renderProgress(progressState.value),
            scrollTrigger: {
              id: "unifies-scrub",
              trigger: section,
              start: "top top",
              end: "bottom bottom",
              scrub: 0.45,
              invalidateOnRefresh: true,
            },
          });

      return () => {
        disposed = true;
        tween?.scrollTrigger?.kill();
        tween?.kill();
        visibilityTrigger.kill();
        backRenderer?.dispose();
        frontRenderer?.dispose();
        if (backHelix) delete backHelix.dataset.renderer;
        if (frontHelix) delete frontHelix.dataset.renderer;
        window.removeEventListener("resize", handleResize);
        renderProgressRef.current = () => undefined;
      };
    },
    { scope: sectionRef, dependencies: [deterministicProgress, reducedMotion, title, visualTest], revertOnUpdate: true },
  );

  if (reducedMotion) return null;

  const mediaState = mediaFailed ? "poster" : mediaReady ? "video" : "loading";

  return (
    <section
      ref={sectionRef}
      className={styles.section}
      data-header-theme="dark"
      data-media-state={mediaState}
      data-progress={deterministicProgress.toFixed(3)}
      data-scene-active="false"
      data-visual-test={visualTest ? "true" : "false"}
      aria-labelledby="unifies-title"
    >
      <div className={styles.backgroundFixed} data-unifies-layer="background" aria-hidden="true">
        <div className={styles.backgroundBase} />
        <img
          className={styles.poster}
          src={assetPath("assets/images/step-bg-01.webp")}
          alt=""
          decoding="async"
        />
        <video
          ref={videoRef}
          className={styles.video}
          src={assetPath("assets/video/computer-unifies-bg.webm")}
          poster={assetPath("assets/images/step-bg-01.webp")}
          muted
          playsInline
          preload="metadata"
          hidden={mediaFailed}
          onLoadedMetadata={() => {
            mediaReadyRef.current = true;
            setMediaReady(true);
            renderProgressRef.current(lastProgressRef.current);
          }}
          onError={() => {
            mediaReadyRef.current = false;
            mediaFailedRef.current = true;
            setMediaReady(false);
            setMediaFailed(true);
            renderProgressRef.current(lastProgressRef.current);
          }}
        />
        <div className={styles.gradientTop} />
        <div className={styles.gradientBottom} />
        <canvas ref={dreamcloudRef} className={styles.dreamcloud} data-unifies-layer="dreamcloud" />
      </div>

      <div className={styles.stickyScene}>
        <canvas
          ref={backHelixRef}
          className={`${styles.helix} ${styles.helixBack}`}
          data-unifies-layer="helix-back"
          aria-hidden="true"
        />
        <div className={styles.title} data-unifies-layer="title">
          <h2 id="unifies-title" aria-label={title}>
            <span aria-hidden="true">
              {titleWords.map(({ word, characters }, wordIndex) => (
                <span key={`${word}-${wordIndex}`}>
                  {wordIndex > 0 ? " " : null}
                  <span className={styles.word}>
                    {characters.map(({ character, index }) => (
                      <span key={`${character}-${index}`} className={styles.character} data-unifies-char>
                        {character}
                      </span>
                    ))}
                  </span>
                </span>
              ))}
            </span>
          </h2>
        </div>
        <canvas
          ref={frontHelixRef}
          className={`${styles.helix} ${styles.helixFront}`}
          data-unifies-layer="helix-front"
          aria-hidden="true"
        />
      </div>
    </section>
  );
}

import { useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { SiteContent, VisualStateFixture } from "../types";
import { readVisualTestFixture } from "../hooks/useVisualTest";
import { assetPath, responsiveImageSrcSet } from "../lib/assets";
import { ProductVideo, type ProductVideoLabels } from "./ProductVideo";
import styles from "./HowItWorks.module.css";

gsap.registerPlugin(ScrollTrigger, useGSAP);

interface HowItWorksProps {
  content: SiteContent["workflow"];
  reducedMotion: boolean;
  visualTest: boolean;
}

const VIDEO_LABELS: Record<"en" | "zh-CN", ProductVideoLabels> = {
  en: {
    play: "Play video",
    pause: "Pause video",
    seek: "Seek video",
    expand: "Open video",
    close: "Close video",
    dialog: "Expanded video",
  },
  "zh-CN": {
    play: "播放视频",
    pause: "暂停视频",
    seek: "调整视频进度",
    expand: "放大视频",
    close: "关闭视频",
    dialog: "放大视频",
  },
};

export function HowItWorks({ content, reducedMotion, visualTest }: HowItWorksProps) {
  const visualFixture: VisualStateFixture = visualTest ? readVisualTestFixture() : { enabled: false };
  const deterministicStep = visualTest ? visualFixture.workflowStep ?? 0 : -1;
  const deterministicMediaTime = visualTest ? visualFixture.mediaTime ?? 1 : 1;
  const sectionRef = useRef<HTMLElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(-1);
  const labels = VIDEO_LABELS[/[\u3400-\u9fff]/.test(content.title) ? "zh-CN" : "en"];

  useGSAP(
    () => {
      const section = sectionRef.current;
      const timeline = timelineRef.current;
      if (!section || !timeline) return;

      const panels = gsap.utils.toArray<HTMLElement>(`.${styles.panel}`, timeline);
      const setActiveStep = (index: number) => {
        const nextIndex = index < 0 ? -1 : Math.max(0, Math.min(panels.length - 1, index));
        section.dataset.activeStep = content.steps[nextIndex]?.id ?? "";
        setActiveIndex(nextIndex);
      };

      if (reducedMotion) {
        setActiveStep(-1);
        return;
      }

      if (visualTest) {
        setActiveStep(deterministicStep);
        return;
      }

      setActiveStep(-1);

      const dimTweens = panels.slice(0, -1).map((panel, index) => {
        const inner = panel.querySelector<HTMLElement>(`.${styles.panelInner}`);
        const nextPanel = panels[index + 1];
        if (!inner || !nextPanel) return null;

        return gsap.to(inner, {
          "--card-scale": 0.94,
          opacity: 0.42,
          filter: "blur(6px)",
          ease: "none",
          scrollTrigger: {
            id: `workflow-card-${index + 1}`,
            trigger: nextPanel,
            start: "top bottom",
            end: () => `top ${window.innerWidth <= 960 ? 104 : 40}px`,
            scrub: 0.35,
            invalidateOnRefresh: true,
          },
        });
      });

      const activeTriggers = panels.map((panel, index) =>
        ScrollTrigger.create({
          id: `workflow-active-${index + 1}`,
          trigger: panel,
          start: "top 55%",
          onEnter: () => setActiveStep(index),
          onEnterBack: () => setActiveStep(index),
        }),
      );

      const leaveTrigger = ScrollTrigger.create({
        id: "workflow-video-exit",
        trigger: timeline,
        start: "top bottom",
        end: "bottom top",
        onEnter: () => setActiveStep(0),
        onEnterBack: () => setActiveStep(panels.length - 1),
        onLeave: () => setActiveStep(-1),
        onLeaveBack: () => setActiveStep(-1),
      });

      return () => {
        dimTweens.forEach((tween) => tween?.kill());
        activeTriggers.forEach((trigger) => trigger.kill());
        leaveTrigger.kill();
      };
    },
    {
      scope: sectionRef,
      dependencies: [content.steps, deterministicStep, reducedMotion, visualTest],
      revertOnUpdate: true,
    },
  );

  return (
    <section
      ref={sectionRef}
      className={`${styles.section} ${reducedMotion ? styles.reducedMotion : ""}`}
      aria-labelledby="workflow-title"
    >
      <header className={styles.heading}>
        <span>{content.eyebrow}</span>
        <h2 id="workflow-title">{content.title}</h2>
      </header>

      <div
        ref={timelineRef}
        className={styles.timeline}
      >
        {content.steps.map((step, index) => (
          <article className={styles.panel} key={step.id} data-step={step.id} style={{ zIndex: index + 1 }}>
            <div className={styles.panelInner}>
              <div className={styles.panelCopy}>
                <span className={styles.number}>{step.number}</span>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </div>
              <div className={styles.panelMedia}>
                <img
                  className={styles.background}
                  src={assetPath(step.background)}
                  srcSet={responsiveImageSrcSet(step.background)}
                  sizes="(max-width: 960px) 100vw, calc(100vw - 80px)"
                  alt=""
                  loading="lazy"
                />
                <div className={styles.videoFrame}>
                  <ProductVideo
                    src={assetPath(step.video)}
                    poster={assetPath(step.poster)}
                    label={step.alt}
                    labels={labels}
                    active={activeIndex === index}
                    reducedMotion={reducedMotion}
                    visualTest={visualTest}
                    visualTestTime={deterministicMediaTime}
                  />
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

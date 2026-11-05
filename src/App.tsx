import { useEffect } from "react";
import { Capabilities } from "./components/Capabilities";
import { CookieBanner } from "./components/CookieBanner";
import { FinalCTA } from "./components/FinalCTA";
import { Footer } from "./components/Footer";
import { Header } from "./components/Header";
import { Hero } from "./components/Hero";
import { HowItWorks } from "./components/HowItWorks";
import { Intro } from "./components/Intro";
import { UnifiesScene } from "./components/UnifiesScene";
import { contentByLocale } from "./content";
import { useLocale } from "./hooks/useLocale";
import { useReducedMotion } from "./hooks/useReducedMotion";
import { readVisualTestFixture } from "./hooks/useVisualTest";

export function App() {
  const visualFixture = readVisualTestFixture();
  const locale = useLocale(visualFixture.locale);
  const reducedMotion = useReducedMotion();
  const visualTest = visualFixture.enabled;
  const content = contentByLocale[locale];
  const shellContent = locale === "zh-CN"
    ? {
        ...content,
        header: { ...contentByLocale.en.header, cta: content.header.cta },
        footer: contentByLocale.en.footer,
      }
    : content;

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dataset.motion = reducedMotion ? "reduced" : "full";
    document.documentElement.dataset.visualTest = visualTest ? "true" : "false";
    document.title = content.meta.title;
    document.querySelector('meta[name="description"]')?.setAttribute("content", content.meta.description);
  }, [content.meta.description, content.meta.title, locale, reducedMotion, visualTest]);

  return (
    <>
      <Header content={shellContent} />
      <main>
        <Hero content={content.hero} accessibility={content.accessibility} reducedMotion={reducedMotion} visualTest={visualTest} />
        <Intro content={content.intro} />
        <UnifiesScene title={content.unifies.title} reducedMotion={reducedMotion} visualTest={visualTest} />
        <HowItWorks content={content.workflow} reducedMotion={reducedMotion} visualTest={visualTest} />
        <Capabilities content={content.capabilities} />
        <FinalCTA content={content.finalCta} />
      </main>
      <Footer content={shellContent.footer} homeLabel={content.accessibility.home} />
      <CookieBanner content={content.cookie} />
    </>
  );
}

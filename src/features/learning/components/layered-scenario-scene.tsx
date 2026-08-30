"use client";

import {
  motion,
  useMotionValue,
  useReducedMotion,
  type TargetAndTransition,
} from "framer-motion";
import Image from "next/image";
import { useEffect, useRef, type PointerEvent, type ReactNode } from "react";

import type { Character } from "@/domain/content/types";
import type { CharacterVisualState, DialogueLine } from "@/domain/scenario/types";
import { useUiPreferences } from "@/features/preferences/ui-preferences-provider";
import { getScenarioScenePresentation } from "@/features/learning/presentation/scenario-presentation";
import { selectLocalizedText, selectSecondaryLocale } from "@/i18n/select-localized-text";
import type { MessageKey } from "@/i18n/messages";

import styles from "../scenario-scene.module.css";

interface LayeredScenarioSceneProps {
  readonly character: Character;
  readonly children?: ReactNode;
  readonly guideOverlay?: ReactNode;
  readonly line?: DialogueLine;
  readonly scenarioId: string;
  readonly showTranslation?: boolean;
  readonly showTransliteration?: boolean;
  readonly visualState: CharacterVisualState;
}

const characterMotion: Readonly<Record<CharacterVisualState, TargetAndTransition>> = {
  idle: { y: [0, -2, 0], scale: [1, 1.003, 1] },
  listening: { y: [0, -3, 0], scale: [1, 1.004, 1] },
  thinking: { y: [0, 1, 0], rotate: [0, -0.3, 0] },
  speaking: { y: [0, -3, 0], scale: [1, 1.005, 1] },
  positive_reaction: { y: [0, -5, 0], scale: [1, 1.008, 1] },
  clarification_reaction: { y: [0, 2, 0], rotate: [0, 0.25, 0] },
};

const characterStateMessage: Readonly<Record<CharacterVisualState, MessageKey>> = {
  idle: "a11y.localCharacterState.ready",
  listening: "a11y.localCharacterState.listening",
  thinking: "a11y.localCharacterState.thinking",
  speaking: "a11y.localCharacterState.speaking",
  positive_reaction: "a11y.localCharacterState.positive",
  clarification_reaction: "a11y.localCharacterState.clarification",
};

export function LayeredScenarioScene({
  character,
  children,
  guideOverlay,
  line,
  scenarioId,
  showTranslation = false,
  showTransliteration = false,
  visualState,
}: LayeredScenarioSceneProps) {
  const reduceMotion = useReducedMotion() ?? false;
  const { direction, locale, t } = useUiPreferences();
  const backgroundX = useMotionValue(0);
  const backgroundY = useMotionValue(0);
  const midgroundX = useMotionValue(0);
  const midgroundY = useMotionValue(0);
  const characterX = useMotionValue(0);
  const characterY = useMotionValue(0);
  const foregroundX = useMotionValue(0);
  const foregroundY = useMotionValue(0);
  const parallaxFrameRef = useRef<number | null>(null);
  const pointerRef = useRef<{ clientX: number; clientY: number } | null>(null);
  const sceneBoundsRef = useRef<DOMRect | null>(null);
  const presentation = getScenarioScenePresentation(scenarioId, character.id);
  const assetMismatch = presentation?.characterAssetPath !== character.visualAssetPath;

  useEffect(() => () => {
    if (parallaxFrameRef.current !== null) cancelAnimationFrame(parallaxFrameRef.current);
  }, []);

  function resetParallax() {
    if (parallaxFrameRef.current !== null) cancelAnimationFrame(parallaxFrameRef.current);
    parallaxFrameRef.current = null;
    pointerRef.current = null;
    sceneBoundsRef.current = null;
    backgroundX.set(0);
    backgroundY.set(0);
    midgroundX.set(0);
    midgroundY.set(0);
    characterX.set(0);
    characterY.set(0);
    foregroundX.set(0);
    foregroundY.set(0);
  }

  function moveParallax(event: PointerEvent<HTMLElement>) {
    if (reduceMotion || !presentation) return;
    pointerRef.current = { clientX: event.clientX, clientY: event.clientY };
    sceneBoundsRef.current ??= event.currentTarget.getBoundingClientRect();
    if (parallaxFrameRef.current !== null) return;

    parallaxFrameRef.current = requestAnimationFrame(() => {
      parallaxFrameRef.current = null;
      const pointer = pointerRef.current;
      const bounds = sceneBoundsRef.current;
      if (!pointer || !bounds || bounds.width === 0 || bounds.height === 0) return;
      const horizontal = (pointer.clientX - bounds.left) / bounds.width - 0.5;
      const vertical = (pointer.clientY - bounds.top) / bounds.height - 0.5;

      backgroundX.set(horizontal * presentation.layers.background.parallax);
      backgroundY.set(vertical * presentation.layers.background.parallax);
      midgroundX.set(horizontal * presentation.layers.midground.parallax);
      midgroundY.set(vertical * presentation.layers.midground.parallax);
      characterX.set(horizontal * presentation.layers.character.parallax);
      characterY.set(vertical * presentation.layers.character.parallax);
      foregroundX.set(horizontal * presentation.layers.foreground.parallax);
      foregroundY.set(vertical * presentation.layers.foreground.parallax);
    });
  }

  if (!presentation || assetMismatch) {
    return (
      <section className={styles.sceneFailure} role="alert">
        <h1>{t("scenario.failure.title")}</h1>
        <p>{t("scenario.failure.body")}</p>
      </section>
    );
  }

  const layer = presentation.layers;

  return (
    <section
      className={styles.sceneCanvas}
      data-ambient-preset={presentation.ambientPreset}
      data-composition={presentation.composition}
      data-scene-id={presentation.scenarioId}
      aria-labelledby="local-character-name"
      onPointerEnter={(event) => { sceneBoundsRef.current = event.currentTarget.getBoundingClientRect(); }}
      onPointerMove={moveParallax}
      onPointerLeave={resetParallax}
      onPointerCancel={resetParallax}
    >
      <motion.div
        className={styles.backgroundLayer}
        data-layer-depth={layer.background.depth}
        data-layer-id={layer.background.id}
        data-parallax={layer.background.parallax}
        data-scene-layer="background"
        style={{ x: backgroundX, y: backgroundY }}
      >
        <motion.div
          className={styles.backgroundImage}
          initial={reduceMotion ? false : { scale: 1.055 }}
          animate={{ scale: 1.025 }}
          transition={{ duration: reduceMotion ? 0 : 1.1, ease: [0.22, 1, 0.36, 1] }}
        >
          <Image
            src={presentation.backgroundAssetPath}
            alt=""
            fill
            priority
            quality={88}
            sizes="100vw"
          />
        </motion.div>
      </motion.div>

      <motion.div
        className={styles.midgroundLayer}
        data-layer-depth={layer.midground.depth}
        data-layer-id={layer.midground.id}
        data-parallax={layer.midground.parallax}
        data-scene-layer="midground"
        style={{ x: midgroundX, y: midgroundY }}
        aria-hidden="true"
      >
        {layer.midground.objects?.map((object) => (
          <span key={object} data-scene-object={object} />
        ))}
      </motion.div>

      <motion.div
        className={styles.characterLayer}
        data-layer-depth={layer.character.depth}
        data-layer-id={layer.character.id}
        data-parallax={layer.character.parallax}
        data-scene-layer="character"
        style={{ x: characterX, y: characterY }}
      >
        <div
          className={styles.characterFigure}
          data-state={visualState}
        >
          <motion.div
            className={styles.characterPose}
            animate={reduceMotion
              ? { y: 0, scale: 1, rotate: 0 }
              : characterMotion[visualState]}
            transition={reduceMotion
              ? { duration: 0 }
              : { duration: visualState === "speaking" ? 2.9 : 4.2, repeat: Infinity, ease: "easeInOut" }}
          >
            <Image
              src={presentation.characterAssetPath}
              alt=""
              fill
              priority
              sizes="(max-width: 639px) 92vw, (max-width: 1023px) 62vw, 44vw"
            />
          </motion.div>
        </div>
      </motion.div>

      <motion.div
        className={styles.foregroundLayer}
        data-layer-depth={layer.foreground.depth}
        data-layer-id={layer.foreground.id}
        data-parallax={layer.foreground.parallax}
        data-scene-layer="foreground"
        style={{ x: foregroundX, y: foregroundY }}
        aria-hidden="true"
      >
        {layer.foreground.objects?.map((object) => (
          <span key={object} data-scene-object={object} />
        ))}
      </motion.div>

      <div
        className={styles.ambientLayer}
        data-layer-depth={layer.ambient.depth}
        data-layer-id={layer.ambient.id}
        data-parallax={layer.ambient.parallax}
        data-scene-layer="ambient"
        aria-hidden="true"
      >
        <span />
        <span />
        <span />
      </div>

      <div className={styles.sceneVignette} aria-hidden="true" />

      <div className={styles.characterIdentity}>
        <strong id="local-character-name">
          <span lang={locale} dir={direction}>{selectLocalizedText(character.displayName, locale)}</span>
          <span aria-hidden="true"> · </span>
          <span
            lang={selectSecondaryLocale(locale)}
            dir={direction === "rtl" ? "ltr" : "rtl"}
            className={locale === "en" ? "font-arabic" : undefined}
          >
            {selectLocalizedText(character.displayName, selectSecondaryLocale(locale))}
          </span>
        </strong>
        <span className={styles.srStatus} role="status" aria-live="polite">
          {t(characterStateMessage[visualState], { name: selectLocalizedText(character.displayName, locale) })}
        </span>
      </div>

      {line ? (
        <div
          className={styles.caption}
          data-scene-caption
          aria-live={visualState === "speaking" ? "polite" : "off"}
        >
          <p lang="ar" dir="rtl" className="font-arabic">{line.arabicText}</p>
          {showTransliteration && line.transliteration ? (
            <p lang="en" dir="ltr" className={styles.transliteration}>{line.transliteration}</p>
          ) : null}
          {showTranslation ? (
            <p lang="en" dir="ltr" className={styles.meaning}>{line.englishMeaning}</p>
          ) : null}
        </div>
      ) : null}

      <div
        className={styles.uiLayer}
        data-layer-depth={layer.ui.depth}
        data-layer-id={layer.ui.id}
        data-parallax={layer.ui.parallax}
        data-scene-layer="ui"
      >
        {children}
      </div>

      <div
        className={styles.guideLayer}
        data-layer-depth={layer.guide.depth}
        data-layer-id={layer.guide.id}
        data-parallax={layer.guide.parallax}
        data-scene-layer="guide"
      >
        {guideOverlay}
      </div>
    </section>
  );
}

"use client";

import type { ReactNode } from "react";

import type { Character } from "@/domain/content/types";
import type { CharacterVisualState, DialogueLine } from "@/domain/scenario/types";
import { LayeredScenarioScene } from "@/features/learning/components/layered-scenario-scene";

interface LocalCharacterProps {
  readonly character: Character;
  readonly children?: ReactNode;
  readonly guideOverlay?: ReactNode;
  readonly line: DialogueLine;
  readonly scenarioId: string;
  readonly showTranslation: boolean;
  readonly showTransliteration: boolean;
  readonly visualState: CharacterVisualState;
}

export function LocalCharacter(props: LocalCharacterProps) {
  return <LayeredScenarioScene {...props} />;
}

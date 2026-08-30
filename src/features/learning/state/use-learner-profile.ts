"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  configureLearnerProfile,
} from "@/application/learning/learner-profile";
import type {
  LearnerProfile,
  LearnerStartingPoint,
} from "@/domain/learning/types";
import {
  createLearnerProfileRepository,
  type LearnerProfileRepository,
} from "@/state/learner-profile-repository";
import { createMockLearnerProfile } from "@/state/mock-learner-profile";

type ProfileUpdater = (profile: LearnerProfile) => LearnerProfile;

export interface LearnerProfileState {
  readonly profile: LearnerProfile;
  readonly ready: boolean;
  readonly persistenceWarning: boolean;
  readonly configure: (startingPoint: LearnerStartingPoint) => Promise<LearnerProfile>;
  readonly update: (updater: ProfileUpdater) => void;
}

export function useLearnerProfile(): LearnerProfileState {
  const [profile, setProfile] = useState<LearnerProfile>(() => createMockLearnerProfile());
  const repositoryRef = useRef<LearnerProfileRepository | null>(null);
  const profileRef = useRef<LearnerProfile>(profile);
  const [ready, setReady] = useState(false);
  const [persistenceWarning, setPersistenceWarning] = useState(false);

  useEffect(() => {
    let active = true;
    const repository = createLearnerProfileRepository();
    repositoryRef.current = repository;

    void repository.load().then((loadedProfile) => {
      if (!active) return;
      profileRef.current = loadedProfile;
      setProfile(loadedProfile);
      setReady(true);
    });

    return () => {
      active = false;
      repositoryRef.current = null;
    };
  }, []);

  const persist = useCallback((nextProfile: LearnerProfile) => {
    profileRef.current = nextProfile;
    setProfile(nextProfile);

    const repository = repositoryRef.current;
    if (!repository) return;

    void repository.save(nextProfile).then((saved) => {
      if (nextProfile.persistOnDevice && !saved) setPersistenceWarning(true);
    });
  }, []);

  const configure = useCallback(async (startingPoint: LearnerStartingPoint) => {
    const nextProfile = configureLearnerProfile(profileRef.current, {
      startingPoint,
      persistOnDevice: true,
      updatedAt: new Date().toISOString(),
    });
    persist(nextProfile);
    return nextProfile;
  }, [persist]);

  const update = useCallback((updater: ProfileUpdater) => {
    persist(updater(profileRef.current));
  }, [persist]);

  return { profile, ready, persistenceWarning, configure, update };
}

/**
 * Programmatic manifest typings. Keep in sync with build-manifest.json.
 */
export type ModuleStage = "boot" | "systems" | "ui" | "telemetry";

export interface ManifestModule {
  id: string;
  label: string;
  type: "script" | "config" | "style" | "inline";
  path: string;
  stage: ModuleStage;
  dependsOn: string[];
  segments: string[];
}

export interface LegacySegment {
  id: string;
  path: string;
  note?: string;
}

export interface BuildManifest {
  version: number;
  generatedAt: string;
  stages: ModuleStage[];
  modules: ManifestModule[];
  legacySegments: LegacySegment[];
}

declare global {
  interface Window {
    ModuleRegistry: {
      manifest: BuildManifest | null;
      modules: Record<string, ManifestModule & { status: string }>;
      register(meta: { id: string; status?: string }): void;
      mark(id: string, status: string): void;
    };
  }
}

export {};

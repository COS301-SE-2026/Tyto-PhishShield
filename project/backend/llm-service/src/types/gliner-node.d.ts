declare module 'gliner/node' {
  export interface GlinerEntity {
    spanText: string;
    start: number;
    end: number;
    label: string;
    score: number;
  }

  export interface GlinerConfig {
    tokenizerPath: string;
    onnxSettings: {
      modelPath: string;
    };
    transformersSettings?: {
      allowLocalModels?: boolean;
      useBrowserCache?: boolean;
    };
    maxWidth?: number;
    modelType?: string;
  }

  export class Gliner {
    constructor(config: GlinerConfig);
    initialize(): Promise<void>;
    inference(options: {
      texts: string[];
      entities: string[];
      flatNer?: boolean;
      threshold?: number;
      multiLabel?: boolean;
    }): Promise<GlinerEntity[][]>;
  }
}

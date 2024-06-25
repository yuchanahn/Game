export declare enum ResizeMode {
    Envelope = "Envelope (Outer Fit)",
    ScaleToFit = "Scale to Fit (Inner Fit)",
    JustResize = "Just Resize"
}
export declare enum Preprocessor {
    None = "none",
    Canny = "canny",
    Depth = "depth",
    Depth_LeRes = "depth_leres",
    HED = "hed",
    MLSD = "mlsd",
    NormalMap = "normal_map",
    OpenPose = "openpose",
    Pidinet = "pidinet",
    Scribble = "scribble",
    Fake_Scribble = "fake_scribble",
    Segmentation = "segmentation"
}
export type ControlNetOptions = {
    inputImageData?: string;
    mask?: string;
    preprocessor?: Preprocessor;
    model?: string;
    weight?: number;
    resizeMode?: ResizeMode;
    lowvram?: boolean;
    thresholdA?: number;
    thresholdB?: number;
    guidance?: number;
    guidanceStart?: number;
    guidanceEnd?: number;
    guessMode?: boolean;
};
export declare const mapControlNetOptions: (options: ControlNetOptions) => any;

// Runs the trained fate model (public/models/fate.onnx) in the browser.
//
// This file is browser-only: it downloads the model and ONNX Runtime Web, so the
// Node tests never import it. Everything that can be tested without a browser
// (turning a board into features, reading the answer) lives in engine/fate.js.
//
// ONNX Runtime Web is about 15 MB, so it isn't part of the page's first load.
// `import()` fetches it the first time someone asks for a prediction, and the
// loaded model is kept for every prediction after that.
import { boardFeatures, readPrediction, FEATURE_COUNT } from '../../engine/fate.js';

let loading = null; // a Promise for { ort, session }, shared by every caller

function loadModel() {
  if (loading === null) {
    loading = (async () => {
      const ort = await import('onnxruntime-web/wasm');
      // Multi-threading needs special server headers that GitHub Pages doesn't send.
      ort.env.wasm.numThreads = 1;
      // BASE_URL is '/astrolabe/' on GitHub Pages, so the path works there and locally.
      const session = await ort.InferenceSession.create(`${import.meta.env.BASE_URL}models/fate.onnx`);
      return { ort, session };
    })();
    // If the download fails, forget the failed attempt so the next click tries again.
    loading.catch(() => { loading = null; });
  }
  return loading;
}

// #region predict
// Board in, guess out. The model sees the same 18 numbers it was trained on,
// computed by the same boardFeatures() function the dataset script used.
export async function predictFate(grid) {
  const { ort, session } = await loadModel();
  const features = boardFeatures(grid);
  // A tensor is the model's input format: numbers plus a shape. [1, 18] means
  // "one board, 18 features each".
  const input = new ort.Tensor('float32', features, [1, FEATURE_COUNT]);
  const outputs = await session.run({ features: input });
  // `probabilities` holds three numbers (dies, settles, active) that add up to 1.
  return readPrediction(Array.from(outputs.probabilities.data));
}
// #endregion

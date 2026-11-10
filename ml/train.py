"""Trains the fate predictor and exports it for the browser.

Run from the project root, after `node scripts/makeDataset.js`:

    ml/.venv/bin/python ml/train.py

The models read 18 numbers per board from boardFeatures() in src/engine/fate.js
(how many live and dead cells have 0..8 live neighbours), not the raw cells.
Four models are trained on the same boards, from dumbest to smartest:
  1. baseline           always guesses the most common fate. Anything useful must beat this.
  2. logistic           logistic regression on the 18 features: one weight per feature.
  3. neural_net_pixels  the same kind of network fed all 900 raw cells instead. Kept as
                        a comparison: it does worse, because a pattern's fate doesn't
                        depend on where it is, and raw cells make it learn every position.
  4. neural_net         a small multi-layer perceptron on the 18 features. This one ships.

Every number is measured on a test set the models never saw while training.
The shipped network is exported to ONNX (a standard model file format) so the
browser can run it with ONNX Runtime Web.
"""

import json
import time
from pathlib import Path

import numpy as np
import onnxruntime
from skl2onnx import convert_sklearn
from skl2onnx.common.data_types import FloatTensorType
from sklearn.dummy import DummyClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, confusion_matrix
from sklearn.model_selection import train_test_split
from sklearn.neural_network import MLPClassifier
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler

ML_DIR = Path(__file__).parent
DATA_DIR = ML_DIR / "data"
MODEL_PATH = ML_DIR.parent / "public" / "models" / "fate.onnx"
RESULTS_PATH = ML_DIR / "results.json"


def load_dataset():
    """Reads the files written by scripts/makeDataset.js."""
    meta = json.loads((DATA_DIR / "meta.json").read_text())
    cells = meta["rows"] * meta["cols"]
    count = meta["count"]
    boards = np.fromfile(DATA_DIR / "boards.bin", dtype=np.uint8).reshape(count, cells)
    # float32 to match the browser, which hands the model a Float32Array.
    features = np.fromfile(DATA_DIR / "features.bin", dtype=np.float32).reshape(count, meta["featureCount"])
    labels = np.fromfile(DATA_DIR / "labels.bin", dtype=np.uint8)
    return boards.astype(np.float32), features, labels, meta


def evaluate(name, model, x_train, y_train, x_test, y_test):
    """Trains one model and measures it on the unseen test boards."""
    started = time.time()
    model.fit(x_train, y_train)
    seconds = time.time() - started
    predictions = model.predict(x_test)
    accuracy = accuracy_score(y_test, predictions)
    print(f"{name:<12} test accuracy {accuracy:.1%}   (trained in {seconds:.0f} s)")
    return {
        "accuracy": round(float(accuracy), 4),
        "train_seconds": round(seconds, 1),
        # Rows are the true fate, columns the guess. The diagonal is "right".
        "confusion": confusion_matrix(y_test, predictions).tolist(),
    }


def export_onnx(model, feature_count):
    """Saves the trained net as fate.onnx. Input: 'features', shape [n, 18], float32."""
    onnx_model = convert_sklearn(
        model,
        initial_types=[("features", FloatTensorType([None, feature_count]))],
        # zipmap off: output plain arrays of probabilities, not a list of dictionaries,
        # which is much easier to read in JavaScript.
        options={MLPClassifier: {"zipmap": False}},
        target_opset=15,
    )
    MODEL_PATH.parent.mkdir(parents=True, exist_ok=True)
    MODEL_PATH.write_bytes(onnx_model.SerializeToString())
    return MODEL_PATH.stat().st_size


def check_export(model, x_test):
    """The ONNX file must give the same answers as the scikit-learn model."""
    session = onnxruntime.InferenceSession(str(MODEL_PATH))
    _, onnx_probabilities = session.run(None, {"features": x_test})
    agreement = np.mean(onnx_probabilities.argmax(axis=1) == model.predict(x_test))
    print(f"ONNX export agrees with scikit-learn on {agreement:.2%} of test boards")
    return float(agreement)


def main():
    boards, features, y, meta = load_dataset()
    fates = meta["fates"]
    # 80% to learn from, 20% held back for testing. stratify keeps the same mix of
    # fates in both parts; random_state makes the split the same every run.
    # Splitting the row numbers once keeps boards and features on the same split.
    train, test = train_test_split(np.arange(len(y)), test_size=0.2, stratify=y, random_state=0)
    print(f"{len(train)} training boards, {len(test)} test boards, fates {fates}\n")

    results = {
        "dataset": {k: meta[k] for k in ("count", "seed", "rows", "cols", "maxGens", "totals")},
        "test_boards": len(test),
        "fates": fates,
        "models": {},
    }

    def run(name, model, x):
        results["models"][name] = evaluate(name, model, x[train], y[train], x[test], y[test])

    run("baseline", DummyClassifier(strategy="most_frequent"), features)
    # StandardScaler rescales each feature to a similar range first. Dead cells with 0
    # neighbours number in the hundreds, live cells with 8 are rare; without scaling,
    # the big numbers would drown out the small ones while the model learns.
    run("logistic", make_pipeline(StandardScaler(), LogisticRegression(max_iter=1000)), features)
    run("neural_net_pixels", MLPClassifier(
        hidden_layer_sizes=(256, 64), early_stopping=True, max_iter=100, random_state=0,
    ), boards)
    net = make_pipeline(StandardScaler(), MLPClassifier(
        hidden_layer_sizes=(64, 32),  # 18 inputs -> 64 -> 32 -> 3 outputs
        early_stopping=True,  # stop once accuracy on a held-out 10% stops improving
        max_iter=300,
        random_state=0,
    ))
    run("neural_net", net, features)

    size = export_onnx(net, features.shape[1])
    print(f"\nSaved {MODEL_PATH.relative_to(ML_DIR.parent)} ({size / 1024:.0f} KB)")
    results["onnx"] = {"bytes": size, "agreement_with_sklearn": check_export(net, features[test])}

    RESULTS_PATH.write_text(json.dumps(results, indent=2) + "\n")
    print(f"Wrote {RESULTS_PATH.relative_to(ML_DIR.parent)}")


if __name__ == "__main__":
    main()

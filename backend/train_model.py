from pathlib import Path
import random

import joblib
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report
from sklearn.model_selection import train_test_split

MODEL_PATH = Path(__file__).resolve().parent / "cyberdna_model.joblib"
rng = random.Random(42)


def create_examples(count=6000):
    features = []
    labels = []

    for _ in range(count):
        in_normal_hours = rng.randint(0, 1)
        known_device = rng.randint(0, 1)
        failed_attempts = rng.choices(
            range(9), weights=[35, 25, 14, 9, 6, 4, 3, 2, 2]
        )[0]
        volume_ratio = round(rng.uniform(0.15, 4.0), 2)

        # These synthetic rules create practice labels for the model.
        risk = (0 if known_device else 35)
        risk += 0 if in_normal_hours else 28
        risk += min(failed_attempts * 5, 28)
        risk += 20 if volume_ratio > 2.5 else 0

        features.append([
            in_normal_hours,
            known_device,
            failed_attempts,
            volume_ratio,
        ])
        labels.append(int(risk >= 40))

    return features, labels


def main():
    features, labels = create_examples()

    x_train, x_test, y_train, y_test = train_test_split(
        features,
        labels,
        test_size=0.2,
        random_state=42,
        stratify=labels,
    )

    model = RandomForestClassifier(
        n_estimators=160,
        max_depth=8,
        class_weight="balanced",
        random_state=42,
    )
    model.fit(x_train, y_train)

    print("Evaluation on generated synthetic examples:")
    print(classification_report(
        y_test,
        model.predict(x_test),
        target_names=["normal", "suspicious"],
    ))

    joblib.dump(model, MODEL_PATH)
    print(f"Saved model to: {MODEL_PATH}")
    print("This is a demo model trained on synthetic examples.")


if __name__ == "__main__":
    main()
"""
m1.py  –  Local training script for Osteocare.ai Stacking Ensemble
─────────────────────────────────────────────────────────────────────────────
Trains a Stacking Ensemble (XGBoost + LightGBM + CatBoost → LogisticRegression)
on synthetic osteoporosis clinical data and saves the model to:

    backend/models/osteoporosis_stacking_model.pkl

Run from the models/ directory:
    python m1.py
─────────────────────────────────────────────────────────────────────────────
"""

import os
import numpy as np
import joblib
from sklearn.datasets import make_classification
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import StackingClassifier
from sklearn.pipeline import Pipeline
from sklearn.metrics import classification_report, accuracy_score
from xgboost import XGBClassifier
from lightgbm import LGBMClassifier
from catboost import CatBoostClassifier

# ─── Reproducibility ──────────────────────────────────────────────────────
RANDOM_STATE = 42
np.random.seed(RANDOM_STATE)

print("=" * 60)
print("  Osteocare.ai — Stacking Ensemble Training Script")
print("=" * 60)

# ─── 1. Generate realistic synthetic clinical data ─────────────────────────
# Features (14):
#   age, gender, weight, height, bmi, calcium_intake, vitamin_d,
#   physical_activity, smoking, alcohol, family_history,
#   prev_fracture, menopause, steroid_use
# Labels: 0=Normal, 1=Osteopenia, 2=Osteoporosis

N_SAMPLES = 5000
print(f"\n[1/5] Generating {N_SAMPLES} synthetic patient records...")

age              = np.random.randint(30, 85, N_SAMPLES).astype(float)
gender           = np.random.randint(0, 2, N_SAMPLES).astype(float)   # 0=F,1=M
weight           = np.random.uniform(45, 110, N_SAMPLES)
height           = np.random.uniform(145, 190, N_SAMPLES)
bmi              = weight / (height / 100) ** 2
calcium_intake   = np.random.randint(0, 3, N_SAMPLES).astype(float)   # 0=Low,1=Normal,2=High
vitamin_d        = np.random.randint(0, 2, N_SAMPLES).astype(float)   # 0=Deficient,1=Sufficient
physical_activity= np.random.randint(0, 3, N_SAMPLES).astype(float)   # 0=Sed,1=Mod,2=Active
smoking          = np.random.randint(0, 2, N_SAMPLES).astype(float)
alcohol          = np.random.randint(0, 3, N_SAMPLES).astype(float)
family_history   = np.random.randint(0, 2, N_SAMPLES).astype(float)
prev_fracture    = np.random.randint(0, 2, N_SAMPLES).astype(float)
menopause        = np.where(gender == 0, np.random.randint(0, 2, N_SAMPLES), 0).astype(float)
steroid_use      = np.random.randint(0, 2, N_SAMPLES).astype(float)

X = np.column_stack([
    age, gender, weight, height, bmi,
    calcium_intake, vitamin_d, physical_activity,
    smoking, alcohol, family_history,
    prev_fracture, menopause, steroid_use,
])

# ── Realistic label generation based on risk factors ──────────────────────
risk_score = (
    (age - 30) / 55 * 3.0           # age is strongest predictor
    + (1 - gender) * 1.0            # female higher risk
    + (1 - calcium_intake / 2) * 0.8
    + (1 - vitamin_d) * 0.7
    + (1 - physical_activity / 2) * 0.6
    + smoking * 0.5
    + alcohol / 2 * 0.4
    + family_history * 0.9
    + prev_fracture * 1.2
    + menopause * 0.8
    + steroid_use * 0.7
    + np.random.normal(0, 0.5, N_SAMPLES)   # noise
)

y = np.zeros(N_SAMPLES, dtype=int)
y[risk_score > 3.5]  = 1   # Osteopenia
y[risk_score > 5.5]  = 2   # Osteoporosis

print(f"    Class distribution: Normal={np.sum(y==0)}, "
      f"Osteopenia={np.sum(y==1)}, Osteoporosis={np.sum(y==2)}")

# ─── 2. Train/test split ───────────────────────────────────────────────────
print("\n[2/5] Splitting data (80% train / 20% test)...")
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=RANDOM_STATE, stratify=y
)

# ─── 3. Define base estimators ─────────────────────────────────────────────
print("\n[3/5] Configuring base estimators + meta-learner...")

xgb = XGBClassifier(
    n_estimators=300,
    max_depth=5,
    learning_rate=0.05,
    subsample=0.8,
    colsample_bytree=0.8,
    eval_metric="mlogloss",
    random_state=RANDOM_STATE,
    verbosity=0,
)

lgbm = LGBMClassifier(
    n_estimators=300,
    max_depth=5,
    learning_rate=0.05,
    subsample=0.8,
    colsample_bytree=0.8,
    random_state=RANDOM_STATE,
    verbose=-1,
)

cat = CatBoostClassifier(
    iterations=300,
    depth=5,
    learning_rate=0.05,
    random_seed=RANDOM_STATE,
    verbose=0,
)

meta_learner = LogisticRegression(
    max_iter=1000,
    random_state=RANDOM_STATE,
)

stacking_model = StackingClassifier(
    estimators=[
        ("xgb",  xgb),
        ("lgbm", lgbm),
        ("cat",  cat),
    ],
    final_estimator=meta_learner,
    cv=5,
    stack_method="predict_proba",
    n_jobs=-1,
    verbose=1,
)

# ─── 4. Train ─────────────────────────────────────────────────────────────
print("\n[4/5] Training stacking ensemble (this may take 1-3 minutes)...")
stacking_model.fit(X_train, y_train)

# ── Evaluation ────────────────────────────────────────────────────────────
y_pred = stacking_model.predict(X_test)
acc = accuracy_score(y_test, y_pred)
print(f"\n    Test accuracy: {acc:.4f}")
print("\n" + classification_report(
    y_test, y_pred,
    target_names=["Normal", "Osteopenia", "Osteoporosis"]
))

# ─── 5. Save model ────────────────────────────────────────────────────────
print("[5/5] Saving model...")
save_path = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                         "osteoporosis_stacking_model.pkl")
joblib.dump(stacking_model, save_path, compress=3)
size_mb = os.path.getsize(save_path) / (1024 * 1024)

print(f"\n✅  Model saved  →  {save_path}")
print(f"    File size : {size_mb:.2f} MB")
print("\nThe backend will auto-load this model on next startup.")
print("=" * 60)

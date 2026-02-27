Place your trained model file here:

    osteoporosis_stacking_model.pkl

How to export from Google Colab
────────────────────────────────
import joblib
joblib.dump(stacking_model, "osteoporosis_stacking_model.pkl")

Then download it and put it in this folder.
The backend will auto-detect it on next startup.
